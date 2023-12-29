<script lang="ts">
  import recipes from '$lib/data/recipes-with-exchanges.json'
  // import requests from '$lib/data/requests.json'
  // import offers from '$lib/data/offers.json'
  import agents from '$lib/data/agents.json'
  import { Decimal } from 'decimal.js'
  import PlanModal from '$lib/PlanModal.svelte'
  import CommitmentModal from '$lib/CommitmentModal.svelte'
  import { Trash, Pencil, PlusCircle } from '$lib/icons'

  // import plan from '$lib/data/plan.json'
  import Header from '$lib/Header.svelte'
  import { goto } from '$app/navigation'
  import { gql } from 'graphql-tag'
  import { PROPOSAL_CORE_FIELDS, INTENT_CORE_FIELDS, PROPOSED_INTENT_CORE_FIELDS, PROPOSAL_RETURN_FIELDS } from '$lib/graphql/proposal.fragments'
  import { flattenRelayConnection } from '$lib/graphql/helpers'
  import { mutation, query } from 'svelte-apollo'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type { RelayConn } from '$lib/graphql/helpers'
  import type { ReadableQuery } from 'svelte-apollo'
  import type { Unit, AgentConnection, Agent, Proposal, ProposalCreateParams, IntentCreateParams, IntentUpdateParams, UnitConnection, ResourceSpecification, ProposalConnection, ProposalUpdateParams, Intent, PlanCreateParams, PlanConnection } from '@valueflows/vf-graphql'

  let commitmentModalProcess: number | undefined;
  let commitmentModalColumn: number | undefined;
  let commitmentModalSide: string | undefined;
  // let selectedCommitment: any;
  let requests: Proposal[] = [];
  let offers: Proposal[] = [];
  let proposalsList: Proposal[] = []
  let currentProcess: any[];
  let createPlan: PlanCreateParams = {
    name: '',
    note: '',
  }

  $: currentProcess;
  // $: if (commitmentModalColumn) {
  //   currentProcess = allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide];
  // }

  const GET_All_PROPOSALS = gql`
    ${PROPOSAL_RETURN_FIELDS}
    query {
      proposals(last: 100000) {
        edges {
          cursor
          node {
            ...ProposalReturnFields
          }
        }
      }
    }
  `

  interface ProposalsQueryResponse {
    proposals: ProposalConnection & RelayConn<any>
  }

  interface PlanQueryResponse {
    plan: PlanConnection & RelayConn<any>
  }

  let getProposals: ReadableQuery<ProposalsQueryResponse> = query(GET_All_PROPOSALS)

  async function fetchProposals() {
    await getProposals.getCurrentResult()
    await getProposals.refetch().then((r) => {
      if (r.data?.proposals.edges.length > 0) {
        proposalsList = flattenRelayConnection(r.data?.proposals)
        // {@const primary = publishes.find(it => !it.reciprocal)}
        //       {#if primary?.publishes?.receiver}
        requests = proposalsList.filter(it => it.publishes?.find(it => !it.reciprocal)?.publishes?.receiver)
        offers = proposalsList.filter(it => it.publishes?.find(it => it.reciprocal)?.publishes?.receiver)
        console.log(requests)
        console.log(offers)
        // console.log(proposalsList[0].publishes[0].publishes)
        // console.log(requests)
      }
    })
  }

  onMount(async () => {
    if (browser) {
      fetchProposals()
      // console log url query values as object
    }
  })


  // ===========================================

  function assignProviderReceiver(commitment, agents) {
    const receivers = agents.filter(it => it.role == commitment?.receiver_role)
    const providers = agents.filter(it => it.role == commitment?.provider_role)
    return Object.assign(
      {},
      commitment,
      receivers.length == 1
        ? {
            receiver: receivers[0]
          }
        : {},
      providers.length == 1
        ? {
            provider: providers[0]
          }
        : {}
    )
  }

  const previousColumn = column => {
    return column
      .reduce((acc, input) => {
        if (input.resourceQuantity.hasNumericalValue > 0) {
          // find a recipe that outputs what the demand wants
          const recipe = recipes
            .filter(it => it.type == 'recipe_process')
            .find(a_recipe => {
              if (input.stage) {
                return a_recipe?.has_recipe_output?.some(
                  output =>
                    output.resourceConformsTo.name == input.resourceConformsTo.name &&
                    a_recipe.process_conforms_to.name == input.stage.name
                )
              } else {
                console.log("else")
                return a_recipe.has_recipe_output.some(
                  output =>
                    output.resourceConformsTo.name == input.resourceConformsTo.name
                )
              }
            })
          // if there is no recipe we just continue
          if (!recipe) return acc
          // find the output that matches the demand
          let matching_output = recipe?.has_recipe_output?.find(
            output => output.resourceConformsTo.name == input.resourceConformsTo.name
          )
          // find the multiplier to make the demand required
          // TODO round up not down like it is now
          // console.log(recipe, matching_output?.resourceQuantity?.hasNumericalValue)
          const multiplier = new Decimal(
            input.resourceQuantity.hasNumericalValue || '1'
          ).div(new Decimal(matching_output?.resourceQuantity?.hasNumericalValue))

          let matching_input = recipe?.has_recipe_input?.find(
            an_input =>
              an_input.resourceConformsTo.name == input.resourceConformsTo.name
          )
          matching_input = assignProviderReceiver(matching_input, agents)
          matching_input = Object.assign({}, matching_input, {
            resourceQuantity: {
              ...matching_input?.resourceQuantity,
              hasNumericalValue: multiplier
                .toDecimalPlaces(0, Decimal.ROUND_UP)
                .toString()
            }
          })

          matching_output = assignProviderReceiver(matching_output, agents)
          matching_output = Object.assign({}, matching_output, {
            resourceQuantity: {
              ...matching_output?.resourceQuantity,
              hasNumericalValue: new Decimal(
                input.resourceQuantity.hasNumericalValue
              )
                .toDecimalPlaces(0, Decimal.ROUND_UP)
                .toString()
            }
          })

          let committedOutputs, committedInputs, new_output, new_input
          if (
            matching_output?.action.label == 'dropoff' ||
            matching_output?.action.label == 'modify'
          ) {
            const existing_process = acc.find(it => it.id == recipe.id)
            if (existing_process) {
              const remaining_processes = acc.filter(it => it.id != existing_process.id)
              const existing_services = existing_process.committedOutputs.filter(
                output => output.action.label != 'dropoff' && output.action.label != 'modify'
              )
              const existing_output = existing_process.committedOutputs.find(
                output => output.id == matching_output.id
              )
              if (existing_output) {
                new_output = {
                  ...existing_output,
                  resourceQuantity: {
                    ...existing_output.resourceQuantity,
                    hasNumericalValue: new Decimal(
                      existing_output.resourceQuantity.hasNumericalValue
                    ).add(matching_output.resourceQuantity.hasNumericalValue)
                  }
                }
              } else {
                new_output = matching_output
              }

              const existing_input = existing_process.committedInputs.find(
                input => input.id == matching_input.id
              )
              if (existing_input) {
                new_input = {
                  ...existing_input,
                  resourceQuantity: {
                    ...existing_input.resourceQuantity,
                    hasNumericalValue: new Decimal(
                      existing_input.resourceQuantity.hasNumericalValue
                    ).add(matching_input.resourceQuantity.hasNumericalValue)
                  }
                }
              } else {
                new_input = matching_input
              }
              const non_service_non_matching_outputs = existing_process.committedOutputs.filter(
                previous_output =>
                  previous_output.id != matching_output.id &&
                  (previous_output.action.label == 'dropoff' ||
                    previous_output.action.label == 'modify')
              )
              const non_matching_inputs = existing_process.committedInputs.filter(
                previous_input => previous_input.id != matching_input?.id
              )
              const non_matching_independent_inputs = non_matching_inputs.filter(
                it => it.independent
              )
              const non_matching_dependent_inputs = non_matching_inputs.filter(
                it => !it.independent
              )
              return [
                ...remaining_processes,
                {
                  ...existing_process,
                  committedOutputs: [
                    ...non_service_non_matching_outputs,
                    new_output,
                    ...existing_services
                  ],
                  committedInputs: [
                    ...non_matching_dependent_inputs,
                    new_input,
                    ...non_matching_independent_inputs
                  ]
                }
              ]
            } else {
              const services = recipe?.has_recipe_output
                .filter(output => output.action.label != 'dropoff' && output.action.label != 'modify')
                .map(service => assignProviderReceiver(service, agents))
              const non_matching_inputs = recipe?.has_recipe_input
                .filter(
                  previous_input =>
                    previous_input.id != matching_input?.id &&
                    previous_input.action.label != 'pickup' &&
                    previous_input.action.label != 'accept'
                )
                .map(it => ({ ...it, independent: true }))
              committedInputs = [matching_input, ...non_matching_inputs]
              committedOutputs = [matching_output, ...services]
            }
          } else {
            committedOutputs = [
              matching_output,
              ...recipe?.has_recipe_output
                .filter(it => it.id != matching_output?.id)
                .map(it => ({ ...it, editable: true }))
                .map(output => assignProviderReceiver(output, agents))
            ]
            committedInputs = recipe?.has_recipe_input
              ?.map(input => assignProviderReceiver(input, agents))
              .map(input =>
                Object.assign({}, input, {
                  resourceQuantity: {
                    ...input.resourceQuantity,
                    hasNumericalValue: new Decimal(
                      input.resourceQuantity.hasNumericalValue
                    )
                      .mul(multiplier)
                      .toDecimalPlaces(0, Decimal.ROUND_UP)
                      .toString()
                  }
                })
              )
          }

          // console.log([
          //   ...acc,
          //   {
          //     id: recipe.id,
          //     name: recipe.name,
          //     based_on: recipe.process_conforms_to,
          //     committedOutputs,
          //     committedInputs
          //   }
          // ])

          return [
            ...acc,
            {
              id: recipe.id,
              name: recipe.name,
              based_on: recipe.process_conforms_to,
              committedOutputs,
              committedInputs
            }
          ]
        }
      }, [])
      .map(process => runInstructions(process))
      .map((process: Process) => createAgreements(process))
  }

  type Process = {
    id: string
    name: string
    based_on: {
      name: string
    }
    committedOutputs: any[]
    committedInputs: any[]
  }
  function runInstructions(process: Process): Process {
    return {
      ...process,
      committedOutputs: process.committedOutputs.map(output => {
        if (output.instructions == 'SumOutputs') {
          const other_outputs = process.committedOutputs.filter(it => it.id != output.id)
          const sum = other_outputs.reduce(
            (acc, output) => acc.add(output.resourceQuantity.hasNumericalValue),
            new Decimal(0)
          )
          return {
            ...output,
            resourceQuantity: {
              ...output.resourceQuantity,
              hasNumericalValue: sum.toDecimalPlaces(0, Decimal.ROUND_UP).toString()
            }
          }
        } else if (output.instructions == 'SumInputs') {
          const sum = process.committedInputs.reduce(
            (acc, output) => acc.add(output.resourceQuantity.hasNumericalValue),
            new Decimal(0)
          )
          return {
            ...output,
            resourceQuantity: {
              ...output.resourceQuantity,
              hasNumericalValue: sum.toDecimalPlaces(0, Decimal.ROUND_UP).toString()
            }
          }
        }
        return output
      }),
      // TODO in the future inputs will have instructions too
      committedInputs: process.committedInputs
    }
  }

  function createAgreements(process: Process): Process {
    return {
      ...process,
      committedOutputs: process.committedOutputs.map(output => {
        const output_exchange = findExchange(output, process.based_on.name)
        const output_agreement = makeAgreement(output, output_exchange, offers)
        if (output_agreement) {
          return {
            ...output,
            agreement: output_agreement
          }
        }
        return output
      }),
      committedInputs: process.committedInputs.map(input => {
        const input_exchange = findExchange(input, undefined)
        const input_agreement = makeAgreement(input, input_exchange, offers)
        if (input_agreement) {
          return {
            ...input,
            agreement: input_agreement
          }
        }
        return input
      })
    }
  }

  type Commitment = {
    resourceConformsTo: { name: string }
    resourceQuantity: { hasNumericalValue: string; hasUnit: { label: string } }
    receiver: { name: string }
    action: {
      label: string
    }
    id: string
  }
  let commitments: Commitment[] = []
  let plan_created = false
  let allColumns: any;
  $: aggregatedCommitments = aggregateCommitments(commitments)
  $: if (!plan_created) {
    allColumns = generateColumns(aggregatedCommitments);
  }
  function createCommitments(requests: { publishes: { proposedIntent: { intent: any }[] }[] }[]): any[] {
    console.log(requests[0].publishes.filter(it => !it.reciprocal))
    return requests.flatMap(request =>
      request.publishes.filter(it => !it.reciprocal).map(proposed_intent => ({
        publishes: proposed_intent.publishes,
        action: {
          label: 'transfer',
        },
        satisfies: proposed_intent.id,
        id: crypto.randomUUID()
      }))
    )
  }
  type Demand = {
    resourceConformsTo: { name: string }
    resourceQuantity: { hasNumericalValue: string; hasUnit: { label: string } }
  }
  function aggregateCommitments(commitments: Commitment[]): Demand[] {
    return Object.values(
      commitments.reduce((acc, commitment) => {
        console.log(commitment)
        if (acc[commitment.publishes.resourceConformsTo.name]) {
          let existing = acc[commitment.publishes.resourceConformsTo.name]
          console.log(existing)
          console.log(commitment)
          acc[commitment.publishes.resourceConformsTo.name] = {
            ...existing,
            resourceQuantity: {
              ...existing.resourceQuantity,
              hasNumericalValue:
                existing.resourceQuantity.hasNumericalValue +
                commitment.publishes.resourceQuantity.hasNumericalValue
            }
          }
        } else {
          acc[commitment.publishes.resourceConformsTo.name] = {
            resourceQuantity: commitment.publishes.resourceQuantity,
            resourceConformsTo: commitment.publishes.resourceConformsTo,
            stage: { name: 'Ship' }
          }
        }
        console.log(acc)
        return acc
      }, {})
    )
  }
  function generateColumns(aggregatedCommitments: any[]): any[] {
    console.log(aggregatedCommitments)
    let previousProcesses = previousColumn(aggregatedCommitments)
    let allColumnsLocal: any[] = []
    while (previousProcesses.length != 0) {
      allColumnsLocal = [previousProcesses, ...allColumnsLocal]
      previousProcesses = previousColumn(
        previousProcesses
          .flatMap((it: any) => it.committedInputs)
          .reduce((acc: any[], process: any) => {
            return [...acc, process]
          }, [])
      )
    }
    return allColumnsLocal
  }

  function findExchange(
    commitment: any,
    based_on_name: string | undefined
  ): undefined | { name: string; note: string } {
    return recipes
      .filter(it => it.type == 'recipe_exchange')
      .find(a_recipe => {
        if (based_on_name) {
          return a_recipe?.has_recipe_clause?.some(
            clause =>
              clause.resourceConformsTo.name ==
                commitment?.resourceConformsTo?.name &&
              clause.stage?.name == based_on_name
          )
        }
        return a_recipe?.has_recipe_clause?.some(
          clause =>
            clause.resourceConformsTo.name == commitment?.resourceConformsTo?.name &&
            clause.stage?.name == commitment.stage?.name
        )
      })
  }

  function makeAgreement(
    commitment: any,
    recipe: undefined | any,
    offers: any[]
  ): undefined | any {
    const reciprocal_clause = recipe?.has_recipe_reciprocal_clause?.[0]
    if (!reciprocal_clause) return
    let numerical_value = reciprocal_clause.resourceQuantity.hasNumericalValue
    let hasUnit = reciprocal_clause.resourceQuantity.hasUnit
    // TODO get data to test the matching offer logic
    // const matching_offer = offers.find(offer => {
    //   offer.proposed_intents.find(
    //     intent =>
    //       intent.intent.resourceConformsTo.name == commitment.resourceConformsTo.name
    //   )
    // })
    // if (matching_offer) {
    //   const reciprocal_intent = matching_offer.proposed_intents.find(
    //     intent => intent.reciprocal
    //   )
    //   numerical_value = reciprocal_intent.resourceQuantity.hasNumericalValue
    //   hasUnit = reciprocal_intent.resourceQuantity
    // }
    return {
      name: recipe.name,
      note: recipe.note,
      commitment: {
        action: reciprocal_clause.action,
        stage: reciprocal_clause.stage,
        resourceConformsTo: reciprocal_clause.resourceConformsTo,
        resourceQuantity: {
          hasNumericalValue: new Decimal(numerical_value)
            .mul(commitment.resourceQuantity.hasNumericalValue)
            .toDecimalPlaces(0, Decimal.ROUND_UP)
            .toString(),
          hasUnit
        }
      }
    }
  }

  let planModalOpen = false
  let commitmentModalOpen = false
  let selectedCommitmentId: string | undefined = undefined
</script>

<!-- {JSON.stringify(allColumns)} -->

<PlanModal bind:open={planModalOpen} planObject = {createPlan} {allColumns} {commitments} editing={false}/>
<CommitmentModal
  bind:open={commitmentModalOpen}
  {selectedCommitmentId}
  {commitmentModalProcess}
  {commitmentModalColumn}
  {commitmentModalSide}
  process = {currentProcess}
  bind:commitments
  on:submit={(event) => {
    plan_created = true;
    // console.log(event.detail.commitment)
    console.log(allColumns[event.detail.column][event.detail.process][event.detail.side])
    if (event.detail.useAs == "update") {
      let commitmentIndex = allColumns[event.detail.column][event.detail.process][event.detail.side].findIndex(it => it.id == event.detail.commitment.id)
      allColumns[event.detail.column][event.detail.process][event.detail.side][commitmentIndex] = {...event.detail.commitment}
    } else {
      allColumns[event.detail.column][event.detail.process][event.detail.side].push(event.detail.commitment)
    }
    // console.log(event.detail.column, event.detail.process, event.detail.side, commitmentIndex)
    // allColumns[event.detail.column][event.detail.process][event.detail.side][commitmentIndex].provider = {...event.detail.commitment.provider}

    // reset form
    selectedCommitmentId = undefined
    commitmentModalProcess = undefined
    commitmentModalColumn = undefined
    commitmentModalSide = undefined
  }}
/>

<!-- custom header introduced to enable planning to be more inline with the beginning of the page -->
<div class="custom-background" style="height: 8vh">
  <div class="mx-auto px-2 sm:px-6 lg:px-8">
    <h2 class="pt-1 text-white text-2xl">Planning</h2>
    <p class="text-white text-xs">This page is for demonstration purposes only</p>
  </div>
</div>

<div class="flex justify-center items-center">
  <!-- <div class="outer-div justify-center items-center">
  <div class="scroll-div justify-center items-center">
  <div class="content-div flex space-x-8 mx-4"> -->
  <div class="flex space-x-8 mx-4 overflow-x-scroll">
    <div class="min-w-[200px]">
      <div class="flex justify-center" style="margin-top: 22px; margin-bottom: 22px">
        <button
          type="button"
          on:click={() => {0
            planModalOpen = true
            // plan_created = true
          }}
          class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >Save plan</button
        >
      </div>
      <h2 class="text-center text-xl font-semibold">Offers</h2>
      <div class="bg-blue-300 border border-gray-400 p-2">
        <!-- Sub-columns -->
        <div class="">
          <div>
            {#each proposalsList as { publishes }}
              {@const reciprocal = publishes?.find(it => it.reciprocal)}
              {@const primary = publishes?.find(it => !it.reciprocal)}
              {#if primary?.publishes?.provider}
                <div
                  class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                >
                  <p>{primary?.publishes?.resourceConformsTo?.name}</p>
                  {#if primary?.publishes?.availableQuantity}
                    <p>
                      {primary?.publishes?.availableQuantity?.hasNumericalValue}
                      {primary?.publishes?.availableQuantity?.hasUnit?.label},
                      {reciprocal?.publishes?.resourceQuantity?.hasNumericalValue}
                      USD per lb
                    </p>
                  {:else}
                    <p>
                      {reciprocal?.publishes?.resourceQuantity?.hasNumericalValue}
                      USD per lb
                    </p>
                  {/if}
                  <p>{primary?.publishes?.provider?.name}</p>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!--
    <div>
      <h2 class="text-center">Offers</h2>
      <div class="bg-blue-300 border border-gray-400 p-2">
        <div
          class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
        >
          <p>Brown Alpaca Dirty</p>
          <div class="flex justify-between">
            <p>20 lbs</p>
            <p>20 lbs</p>
          </div>
          <p>WoodLand Meadow</p>
        </div>
      </div>
    </div>
    -->
    <!-- Main Columns -->
    <!-- {JSON.stringify(allColumns[0])} -->
    <!-- {#each allColumns as processes}
      {@const { image, name } = processes[0].based_on}
      {JSON.stringify(name)}
    {/each} -->
    {#each allColumns as processes, columnIndex}
      {@const { image, name } = processes[0].based_on}
      <div class="min-w-[400px]">
        <img class="mx-auto" height="80px" width="80px" src={image} alt="" />
        <h2 class="text-center text-xl font-semibold">{name}</h2>
        {#each processes as { committedInputs, committedOutputs }, processIndex}
          <div class="bg-gray-400 border border-gray-400 p-2">
            <!-- Sub-columns -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <button
                  class="flex justify-center items-center w-full mb-2"
                  on:click={() => {
                    commitmentModalProcess = processIndex
                    commitmentModalColumn = columnIndex
                    commitmentModalSide = "committedInputs"
                    commitmentModalOpen = true
                  }}
                >
                  <PlusCircle />
                </button>

                {#each committedInputs as { resourceConformsTo, receiver, provider, resourceQuantity, action, editable, id, agreement }}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                  >
                    <p>{resourceConformsTo?.name}</p>
                    <div class="flex justify-between">
                      <!--
                      <p>
                        {supply_driven_quantity?.hasNumericalValue}
                        {supply_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                      <p>
                        {action.label}
                        {new Decimal(resourceQuantity?.hasNumericalValue).toString()}
                        {resourceQuantity?.hasUnit?.label}
                      </p>
                      <!--
                      <p>
                        {demand_driven_quantity?.hasNumericalValue}
                        {demand_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                    </div>
                    <p>
                      from: {provider?.name || ''}<br />
                      to: {receiver?.name || ''}
                    </p>
                    {#if agreement}
                      {@const commitment = agreement.commitment}
                      <p>
                        cost: {new Decimal(
                          commitment.resourceQuantity.hasNumericalValue
                        )
                          .toFixed(2, Decimal.ROUND_HALF_UP)
                          .toString()}
                        {commitment.resourceConformsTo.name}
                      </p>
                    {/if}
                    <div class="w-full flex justify-center">
                      <button
                        on:click={() => {
                          commitmentModalProcess = processIndex
                          commitmentModalColumn = columnIndex
                          commitmentModalSide = "committedInputs"
                          console.log(id)
                          selectedCommitmentId = id
                          currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                          commitmentModalOpen = true
                        }}
                      >
                        <Pencil/>
                      </button>
                      <button
                        on:click={() => {
                          plan_created = true
                          allColumns[columnIndex][processIndex].committedInputs = allColumns[columnIndex][processIndex].committedInputs.filter(it => it.id != id)
                        }}
                      >
                        <Trash />
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
              <div>
                <button
                  class="flex justify-center items-center w-full mb-2"
                  on:click={() => {
                    commitmentModalProcess = processIndex
                    commitmentModalColumn = columnIndex
                    commitmentModalSide = "committedOutputs"
                    commitmentModalOpen = true
                  }}
                >
                  <PlusCircle />
                </button>

                {#each committedOutputs as { resourceConformsTo, receiver, provider, resourceQuantity, action, editable, id, agreement }}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                  >
                    <div>
                      <p>{resourceConformsTo?.name}</p>
                      <div class="flex justify-between">
                        <!--
                      <p>
                        {supply_driven_quantity?.hasNumericalValue}
                        {supply_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                        <p>
                          {action.label}
                          {resourceQuantity?.hasNumericalValue}
                          {resourceQuantity?.hasUnit?.label}
                        </p>
                        <!--
                      <p>
                        {demand_driven_quantity?.hasNumericalValue}
                        {demand_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                      </div>
                      <p>
                        from: {provider?.name || ''}<br />
                        to: {receiver?.name || ''}
                      </p>
                      {#if agreement}
                        {@const commitment = agreement.commitment}
                        <p>
                          cost: {new Decimal(
                            commitment.resourceQuantity.hasNumericalValue
                          )
                            .toFixed(2, Decimal.ROUND_HALF_UP)
                            .toString()}
                          {commitment.resourceConformsTo.name}
                        </p>
                      {/if}
                    </div>
                    <!-- {#if editable} -->
                    <div class="w-full flex justify-center">
                      <button
                        on:click={() => {
                          commitmentModalProcess = processIndex
                          commitmentModalColumn = columnIndex
                          commitmentModalSide = "committedOutputs"
                          selectedCommitmentId = id
                          currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                          commitmentModalOpen = true
                        }}
                      >
                        <Pencil/>
                      </button>
                      <button
                        on:click={() => {
                          plan_created = true
                          allColumns[columnIndex][processIndex].committedOutputs = allColumns[columnIndex][processIndex].committedOutputs.filter(it => it.id != id)
                        }}
                      >
                        <Trash />
                      </button>
                    </div>
                    <!-- {/if} -->
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/each}

    <div class="min-w-[250px] mt-20">
      <h2 class="text-center text-xl font-semibold">Satisfy Requests</h2>
      <div class="bg-blue-300 border border-gray-400 p-2">
        <!-- Sub-columns -->
        <div class="">
          <div>
            <button
              class="flex justify-center items-center w-full mb-2"
              on:click={() => {
                commitmentModalOpen = true
              }}
            >
              <PlusCircle />
            </button>
            {#if commitments.length == 0}
              <div class="flex justify-center my-4">
                <button
                  type="button"
                  on:click={() => (commitments = createCommitments(requests))}
                  class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >Create from requests</button
                >
              </div>
            {/if}
            {#each commitments as c}
              {@const resourceConformsTo = c.publishes.resourceConformsTo}
              {@const resourceQuantity = c.publishes.resourceQuantity}
              {@const receiver = c.publishes.receiver}
              {@const id = c.id}
              {@const action = c.action}
              <div
                class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
              >
                <div>
                  <p>{resourceConformsTo?.name}</p>
                  <p>
                    {action.label}
                    {resourceQuantity?.hasNumericalValue}
                    {resourceConformsTo?.defaultUnitOfResource?.label}
                  </p>
                  <p>to: {receiver?.name}</p>
                </div>
                <div class="w-full flex justify-center">
                  <button
                    on:click={() => {
                      selectedCommitmentId = id
                      commitmentModalOpen = true
                    }}
                  >
                    <Pencil />
                  </button>
                  <button
                    on:click={() => (commitments = commitments.filter(it => it.id != id))}
                  >
                    <Trash />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <div class="min-w-[200px] mt-20">
      <h2 class="text-center text-xl font-semibold">Requests</h2>
      <div class="bg-blue-300 border border-gray-400 p-2">
        <!-- Sub-columns -->
        <div class="">
          <div>
            {#each proposalsList as { publishes }}
              {@const reciprocal = publishes.find(it => it.reciprocal)}
              {@const primary = publishes.find(it => !it.reciprocal)}
              {#if primary?.publishes?.receiver}
                <div
                  class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                >
                  <p>{primary?.publishes?.resourceConformsTo?.name}</p>
                  <p>
                    {primary?.publishes?.action?.label}
                    {primary?.publishes?.resourceQuantity?.hasNumericalValue}
                    {primary?.publishes?.availableQuantity?.hasUnit?.label}
                  </p>
                  <p>{primary?.publishes?.receiver?.name}</p>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- </div>
  </div> -->
</div>

<style>
  /* Custom CSS */
  .custom-background {
    background-image: url('/heading3.png');
    background-size: cover;
    background-position: center;
  }
</style>
