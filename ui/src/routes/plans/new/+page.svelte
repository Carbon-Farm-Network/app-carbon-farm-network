<script lang="ts">
  import recipes from '$lib/data/recipes-with-exchanges.json'
  // import requests from '$lib/data/requests.json'
  // import offers from '$lib/data/offers.json'
  // import agents from '$lib/data/agents.json'
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
  import type { Unit, AgentConnection, Agent, Proposal, ProposalCreateParams, IntentCreateParams, IntentUpdateParams, UnitConnection, ResourceSpecification, ProposalConnection, ProposalUpdateParams, Intent, PlanCreateParams } from '@valueflows/vf-graphql'

  let requests: Proposal[] = [];
  let proposalsList: Proposal[] = []
  let createPlan: PlanCreateParams = {
    name: '',
    note: '',
  }

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

  let getProposals: ReadableQuery<ProposalsQueryResponse> = query(GET_All_PROPOSALS)

  async function fetchProposals() {
    await getProposals.getCurrentResult()
    await getProposals.refetch().then((r) => {
      if (r.data?.proposals.edges.length > 0) {
        proposalsList = flattenRelayConnection(r.data?.proposals)
        // {@const primary = publishes.find(it => !it.reciprocal)}
        //       {#if primary?.publishes?.receiver}
        requests = proposalsList.filter(it => it.publishes?.find(it => !it.reciprocal)?.publishes?.receiver)
        console.log(requests)
        // console.log(proposalsList[0].publishes[0].publishes)
        // console.log(requests)
      }
    })
  }

  onMount(() => {
    if (browser) {
      fetchProposals()
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
    return column.reduce((acc, input) => {
      if (input.resource_quantity.has_numerical_value > 0) {
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
        // console.log(recipe, matching_output?.resource_quantity?.has_numerical_value)
        const multiplier = new Decimal(
          input.resource_quantity.has_numerical_value || '1'
        ).div(new Decimal(matching_output?.resource_quantity?.has_numerical_value))
        let matching_input = recipe?.has_recipe_input?.find(
          an_input =>
            an_input.resourceConformsTo.name == input.resourceConformsTo.name
        )
        matching_input = assignProviderReceiver(matching_input, agents)
        matching_input = Object.assign({}, matching_input, {
          resource_quantity: {
            ...matching_input?.resource_quantity,
            has_numerical_value: multiplier
              .toDecimalPlaces(0, Decimal.ROUND_UP)
              .toString()
          }
        })
        matching_output = assignProviderReceiver(matching_output, agents)
        matching_output = Object.assign({}, matching_output, {
          resource_quantity: {
            ...matching_output?.resource_quantity,
            has_numerical_value: new Decimal(input.resource_quantity.has_numerical_value)
              .toDecimalPlaces(0, Decimal.ROUND_UP)
              .toString()
          }
        })
        let has_output, has_input, new_output, new_input
        if (matching_output?.action == 'dropoff' || matching_output?.action == 'modify') {
          const existing_process = acc.find(it => it.id == recipe.id)
          if (existing_process) {
            const remaining_processes = acc.filter(it => it.id != existing_process.id)
            const existing_services = existing_process.has_output.filter(
              output => output.action != 'dropoff' && output.action != 'modify'
            )
            const existing_output = existing_process.has_output.find(
              output => output.id == matching_output.id
            )
            if (existing_output) {
              new_output = {
                ...existing_output,
                resource_quantity: {
                  ...existing_output.resource_quantity,
                  has_numerical_value: new Decimal(
                    existing_output.resource_quantity.has_numerical_value
                  ).add(matching_output.resource_quantity.has_numerical_value)
                }
              }
            } else {
              new_output = matching_output
            }

            const existing_input = existing_process.has_input.find(
              input => input.id == matching_input.id
            )
            if (existing_input) {
              new_input = {
                ...existing_input,
                resource_quantity: {
                  ...existing_input.resource_quantity,
                  has_numerical_value: new Decimal(
                    existing_input.resource_quantity.has_numerical_value
                  ).add(matching_input.resource_quantity.has_numerical_value)
                }
              }
            } else {
              new_input = matching_input
            }
            const non_service_non_matching_outputs = existing_process.has_output.filter(
              previous_output =>
                previous_output.id != matching_output.id &&
                (previous_output.action == 'dropoff' ||
                  previous_output.action == 'modify')
            )
            const non_matching_inputs = existing_process.has_input.filter(
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
                has_output: [
                  ...non_service_non_matching_outputs,
                  new_output,
                  ...existing_services
                ],
                has_input: [
                  ...non_matching_dependent_inputs,
                  new_input,
                  ...non_matching_independent_inputs
                ]
              }
            ]
          } else {
            const services = recipe?.has_recipe_output
              .filter(output => output.action != 'dropoff' && output.action != 'modify')
              .map(service => assignProviderReceiver(service, agents))
            const non_matching_inputs = recipe?.has_recipe_input
              .filter(
                previous_input =>
                  previous_input.id != matching_input?.id &&
                  previous_input.action != 'pickup' &&
                  previous_input.action != 'accept'
              )
              .map(it => ({ ...it, independent: true }))
            has_input = [matching_input, ...non_matching_inputs]
            has_output = [matching_output, ...services]
          }
        } else {
          has_output = [
            matching_output,
            ...recipe?.has_recipe_output
              .filter(it => it.id != matching_output?.id)
              .map(it => ({ ...it, editable: true }))
              .map(output => assignProviderReceiver(output, agents))
          ]
          has_input = recipe?.has_recipe_input
            ?.map(input => assignProviderReceiver(input, agents))
            .map(input =>
              Object.assign({}, input, {
                resource_quantity: {
                  ...input.resource_quantity,
                  has_numerical_value: new Decimal(
                    input.resource_quantity.has_numerical_value
                  )
                    .mul(multiplier)
                    .toDecimalPlaces(0, Decimal.ROUND_UP)
                    .toString()
                }
              })
            )
        }
        return [
          ...acc,
          {
            id: recipe.id,
            name: recipe.name,
            process_conforms_to: recipe.process_conforms_to,
            has_output,
            has_input
          }
        ]
      }
    }, [])
  }

  type Commitment = {
    resourceConformsTo: { name: string }
    resource_quantity: { has_numerical_value: string; has_unit: { label: string } }
    receiver: { name: string }
    action: string
    id: string
  }
  let commitments: Commitment[] = []
  $: aggregatedCommitments = aggregateCommitments(commitments)
  $: allColumns = generateColumns(aggregatedCommitments)
  
  function createCommitments(requests: { publishes: { proposedIntent: { intent: any }[] }[] }[]): any[] {
    return requests.flatMap(request =>
      request.publishes.map(proposed_intent => ({
        ...proposed_intent.intent,
        action: 'transfer',
        satisfies: proposed_intent.id,
        id: crypto.randomUUID()
      }))
    )
  }
  type Demand = {
    resourceConformsTo: { name: string }
    resource_quantity: { has_numerical_value: string; has_unit: { label: string } }
  }
  function aggregateCommitments(commitments: Commitment[]): Demand[] {
    return Object.values(
      commitments.reduce((acc, commitment) => {
        console.log(commitment)
        // console.log(commitment[0].publishes.filter(it => it.reciprocal))
        if (acc[commitment.publishes[0].resourceConformsTo.name]) {
          let existing = acc[commitment.publishes[0].resourceConformsTo.name]
          acc[commitment.publishes[0].resourceConformsTo.name] = {
            ...existing,
            resource_quantity: {
              ...existing.resource_quantity,
              has_numerical_value:
                existing.resource_quantity.has_numerical_value +
                commitment.resource_quantity.has_numerical_value
            }
          }
        } else {
          acc[commitment.publishes[0].resourceConformsTo.name] = {
            resource_quantity: commitment.resource_quantity,
            resourceConformsTo: commitment.publishes[0].resourceConformsTo,
            stage: { name: 'Ship' }
          }
        }
        return acc
      }, {})
    )
  }
  function generateColumns(aggregatedCommitments: any[]): any[] {
    let previousProcesses = previousColumn(aggregatedCommitments)
    let allColumns: any[] = []
    while (previousProcesses.length != 0) {
      allColumns = [previousProcesses, ...allColumns]
      previousProcesses = previousColumn(
        previousProcesses
          .flatMap((it: any) => it.has_input)
          .reduce((acc: any[], process: any) => {
            return [...acc, process]
          }, [])
      )
    }
    return allColumns
  }

  let planModalOpen = false
  let commitmentModalOpen = false
  let selectedCommitmentId: string | undefined = undefined
</script>

{JSON.stringify(commitments)}

<PlanModal bind:open={planModalOpen} planObject = {createPlan} {allColumns} {commitments}/>
<CommitmentModal
  bind:open={commitmentModalOpen}
  {selectedCommitmentId}
  bind:commitments
/>

<!-- custom header introduced to enable planning to be more inline with the beginning of the page -->
<div class="custom-background" style="height: 8vh">
  <div class="mx-auto px-2 sm:px-6 lg:px-8">
    <h2 class="pt-1 text-white text-2xl">Planning</h2>
    <p class="text-white text-xs">This page is for demonstration purposes only</p>
  </div>
</div>

<div class="pt-4 flex justify-center items-center">
  <div class="flex space-x-8 mx-4 overflow-x-scroll">
    <div class="min-w-[200px]">
      <div class="flex justify-center" style="margin-top: 22px; margin-bottom: 22px">
        <button
          type="button"
          on:click={() => (planModalOpen = true)}
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
    {#each allColumns as processes}
      {@const { image, name } = processes[0].process_conforms_to}
      <div class="min-w-[400px]">
        <img class="mx-auto" height="80px" width="80px" src={image} alt="" />
        <h2 class="text-center text-xl font-semibold">{name}</h2>
        {#each processes as { has_input, has_output }}
          <div class="bg-gray-400 border border-gray-400 p-2">
            <!-- Sub-columns -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <button
                  class="flex justify-center items-center w-full mb-2"
                  on:click={() => {
                    commitmentModalOpen = true
                  }}
                >
                  <PlusCircle />
                </button>
                {#each has_input as { resourceConformsTo, provider, resource_quantity, action, receiver }}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                  >
                    <p>{resourceConformsTo?.name}</p>
                    <div class="flex justify-between">
                      <!--
                      <p>
                        {supply_driven_quantity?.has_numerical_value}
                        {supply_driven_quantity?.has_unit?.label}
                      </p>
                      -->
                      <p>
                        {action}
                        {new Decimal(resource_quantity?.has_numerical_value).toString()}
                        {resource_quantity?.has_unit?.label}
                      </p>
                      <!--
                      <p>
                        {demand_driven_quantity?.has_numerical_value}
                        {demand_driven_quantity?.has_unit?.label}
                      </p>
                      -->
                    </div>
                    <p>
                      from: {provider?.name || ''}<br />
                      to: {receiver?.name || ''}
                    </p>
                  </div>
                {/each}
              </div>
              <div>
                <button
                  class="flex justify-center items-center w-full mb-2"
                  on:click={() => {
                    commitmentModalOpen = true
                  }}
                >
                  <PlusCircle />
                </button>
                {#each has_output as { resourceConformsTo, receiver, provider, resource_quantity, action, editable, id }}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                  >
                    <div>
                      <p>{resourceConformsTo?.name}</p>
                      <div class="flex justify-between">
                        <!--
                      <p>
                        {supply_driven_quantity?.has_numerical_value}
                        {supply_driven_quantity?.has_unit?.label}
                      </p>
                      -->
                        <p>
                          {action}
                          {resource_quantity?.has_numerical_value}
                          {resource_quantity?.has_unit?.label}
                        </p>
                        <!--
                      <p>
                        {demand_driven_quantity?.has_numerical_value}
                        {demand_driven_quantity?.has_unit?.label}
                      </p>
                      -->
                      </div>
                      <p>
                        from: {provider?.name || ''}<br />
                        to: {receiver?.name || ''}
                      </p>
                    </div>
                    {#if editable}
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
                          on:click={() => {
                            selectedCommitmentId = id
                            commitmentModalOpen = true
                          }}
                        >
                          <Trash />
                        </button>
                      </div>
                    {/if}
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
            {#each commitments as { resourceConformsTo, resource_quantity, receiver, id, action }}
              <div
                class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
              >
                <div>
                  <p>{resourceConformsTo?.name}</p>
                  <p>
                    {action}
                    {resource_quantity?.has_numerical_value}
                    {resource_quantity?.has_unit?.label}
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
</div>

<style>
  /* Custom CSS */
  .custom-background {
    background-image: url('/heading3.png');
    background-size: cover;
    background-position: center;
  }
</style>
