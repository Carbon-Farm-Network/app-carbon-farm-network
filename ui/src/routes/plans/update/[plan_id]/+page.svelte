<script lang="ts">
  import recipes from '$lib/data/recipes-with-exchanges.json'
  // import requests from '$lib/data/requests.json'
  // import offers from '$lib/data/offers.json'
  import agents from '$lib/data/agents.json'
  import { Decimal } from 'decimal.js'
  import PlanModal from '$lib/PlanModal.svelte'
  import CommitmentModal from '$lib/CommitmentModal.svelte'
  import EconomicEventModal from '$lib/EconomicEventModal.svelte'
  import { Trash, Pencil, PlusCircle, EconomicEvent } from '$lib/icons'
  import { page } from '$app/stores';

  // import plan from '$lib/data/plan.json'
  import Header from '$lib/Header.svelte'
  import { goto } from '$app/navigation'
  import { gql } from 'graphql-tag'
  import { PROPOSAL_CORE_FIELDS, INTENT_CORE_FIELDS, PROPOSED_INTENT_CORE_FIELDS, PROPOSAL_RETURN_FIELDS } from '$lib/graphql/proposal.fragments'
  import { COMMITMENT_RETURN_FIELDS, PLAN_RETURN_FIELDS, PROCESS_RETURN_FIELDS, SIMPLIFIED_PLAN_RETURN_FIELDS } from '$lib/graphql/plan.fragments'
  import { flattenRelayConnection } from '$lib/graphql/helpers'
  import { mutation, query } from 'svelte-apollo'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type { RelayConn } from '$lib/graphql/helpers'
  import type { ReadableQuery } from 'svelte-apollo'
  import type { Unit, AgentConnection, Agent, Proposal, Plan, ProposalCreateParams, IntentCreateParams, IntentUpdateParams, UnitConnection, ResourceSpecification, ProposalConnection, CommitmentConnection, ProposalUpdateParams, Intent, PlanCreateParams, PlanConnection, EconomicEventCreateParams, ProcessConnection, FulfillmentCreateParams } from '@valueflows/vf-graphql'

  const delay = ms => new Promise(res => setTimeout(res, ms));
  let commitmentModalProcess: number | undefined;
  let commitmentModalColumn: number | undefined;
  let commitmentModalSide: string | undefined;
  let currentProcess: any[];
  let commitmentsToDelete: string[] = []
  let processesToLoadCount = 0;
  let processesLoadedCount = 0;
  let selectedProcessId: string | undefined = undefined;
  let error: any;
  let yellow: any[] = []

  let processImages = {
    "Pick Up": "/farm.svg",
    "Ship": "/truck.svg",
    "Spin Yarn": "/socks.svg",
    "Scour Fiber": "/mill.svg"
  }

  let planId = ''
  $: if ($page.params.plan_id) {
    planId = $page.params.plan_id;
  }

  $: allColumns, commitmentModalColumn, commitmentModalProcess, commitmentModalSide, currentProcess, commitmentModalOpen, economicEventModalOpen;

  let requests: Proposal[] = [];
  let offers: Proposal[] = [];
  let proposalsList: Proposal[] = []
  let plan: any;
  let loadingPlan: boolean = true;
  let allColumns: any = []
  $: loadingPlan, currentProcess

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

  const GET_PLAN = gql`
    ${PLAN_RETURN_FIELDS}
    query GetPlan($id: ID!) {
      plan(id: $id) {
        ...PlanReturnFields
      }
    }
  `

  const GET_SIMPLIFIED_PLAN = gql`
    ${SIMPLIFIED_PLAN_RETURN_FIELDS}
    query GetPlan($id: ID!) {
      plan(id: $id) {
        ...SimplifiedPlanReturnFields
      }
    }
  `

  const GET_PROCESS = gql`
    ${PROCESS_RETURN_FIELDS}
    query GetProcess($id: ID!) {
      process(id: $id) {
        ...ProcessReturnFields
      }
    }
  `

  const GET_COMMITMENT = gql`
    ${COMMITMENT_RETURN_FIELDS}
    query getCommitment($id: ID!) {
      commitment(id: $id) {
        ...CommitmentReturnFields
      }
    }
  `

  const CREATE_ECONOMIC_EVENT = gql`
    mutation($event: EconomicEventCreateParams!) {
      createEconomicEvent(event: $event) {
        economicEvent {
          id
          revisionId
        }
      }
    }
  `

  const CREATE_FULFILLMENT = gql`
    mutation($fulfillment: FulfillmentCreateParams!) {
      createFulfillment(fulfillment: $fulfillment) {
        fulfillment {
          id
          revisionId
        }
      }
    }
  `

  const UPDATE_COMMITMENT = gql`
    mutation($commitment: CommitmentUpdateParams!) {
      updateCommitment(commitment: $commitment) {
        commitment {
          id
          revisionId
          plannedWithin {
            id
          }
        }
      }
    }
  `

  let addEconomicEvent: any = mutation(CREATE_ECONOMIC_EVENT)
  let addFulfillment: any = mutation(CREATE_FULFILLMENT)
  let updateCommitment: any = mutation(UPDATE_COMMITMENT)

  interface ProposalsQueryResponse {
    proposals: ProposalConnection & RelayConn<any>
  }

  interface PlanQueryResponse {
    plan: PlanConnection & RelayConn<any>
  }

  interface ProcessQueryResponse {
    process: ProcessConnection & RelayConn<any>
  }

  interface CommitmentQueryResponse {
    commitment: CommitmentConnection & RelayConn<any>
  }

  let getProposals: ReadableQuery<ProposalsQueryResponse> = query(GET_All_PROPOSALS)
  let getPlan: ReadableQuery<PlanQueryResponse> = query(GET_PLAN);
  let getSimplifiedPlan: ReadableQuery<PlanQueryResponse> = query(GET_SIMPLIFIED_PLAN);
  let getProcess: ReadableQuery<ProcessQueryResponse> = query(GET_PROCESS);
  let getCommitment: ReadableQuery<CommitmentQueryResponse> = query(GET_COMMITMENT);
    
  async function fetchProposals() {
    try {
      await getProposals.getCurrentResult()
      await getProposals.refetch().then((r) => {
        if (r.data?.proposals.edges.length > 0) {
          proposalsList = flattenRelayConnection(r.data?.proposals)
          // {@const primary = publishes.find(it => !it.reciprocal)}
          //       {#if primary?.publishes?.receiver}
          requests = proposalsList.filter(it => it.publishes?.find(it => !it.reciprocal)?.publishes?.receiver)
          offers = proposalsList.filter(it => it.publishes?.find(it => it.reciprocal)?.publishes?.receiver)
          // console.log(requests)
          // console.log(offers)
          // console.log(proposalsList[0].publishes[0].publishes)
          // console.log(requests)
        }
      })
    } catch (e) {
      console.log(e)
      error = e
    }
  }

  async function saveCommitment(commitment: any) {
    try {
      console.log("commitment!", commitment)
      let x = await updateCommitment({
        variables: {
          commitment: {
            revisionId: commitment.revisionId,
            finished: commitment.finished,
          },
        }
      })
      console.log(x)
    } catch (e) {
      console.log(e)
    }
  }

  async function fetchCommitment(id: string) {
    try {
      console.log("getting commitment", id)
      getCommitment.setVariables({
        id: id
      });
      const res = await getCommitment.refetch()
      console.log(res)
      return res.data.commitment
    } catch (e) {
      console.log(e)
    }
  }

  async function saveEconomicEvent(commitment: any, process: any, side: string) {
    try {
      console.log("ho", commitment)
      const economicEvent: EconomicEventCreateParams = {
        // note: commitment.note,
        action: commitment.action.id,
        provider: commitment.provider.id,
        receiver: commitment.receiver.id,
        // hasPointInTime: new Date(),
        // resourceClassifiedAs: ["commitment.resourceConformsTo.id"],
        resourceConformsTo: commitment.resourceConformsTo.id,
        resourceQuantity: {
          hasNumericalValue: commitment.resourceQuantity.hasNumericalValue,
          hasUnit: commitment.resourceQuantity.hasUnit.id,
        },
        hasBeginning: new Date(),
        // inScopeOf: ['some-accounting-scope'],
      }

      if (side == "committedInputs") {
        economicEvent.inputOf = process
      } else if (side == "committedOutputs"){
        economicEvent.outputOf = process
      }

      console.log("economic event", economicEvent)
      
      let x = await addEconomicEvent({
        variables: {
          event: economicEvent,
        }
      })
      console.log(x)

      const fulfillment: FulfillmentCreateParams = {
        fulfilledBy: x.data.createEconomicEvent.economicEvent.id,
        fulfills: commitment.id,
      }

      console.log("fulfillment", fulfillment)
      let y = await addFulfillment({
        variables: {
          fulfillment: fulfillment,
        }
      })
      console.log("y", y)

      await saveCommitment(commitment)
    } catch (e) {
      console.log(e)
    }
  }

  onMount(async () => {
    if (browser) {
      try {
        // console.log(GET_PLAN)
        // fetchProposals()
        // console.log(planId)
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++")
      // getPlan.setVariables({
        //   id: planId
        // });
        getSimplifiedPlan.setVariables({
          id: planId
        });
        // const res = await getPlan.refetch()
        const res = await getSimplifiedPlan.refetch()
        plan = {...res.data.plan}
        // plan = {...res.data.plan}
        // alert(JSON.stringify(plan.independentDemands[0]))
        console.log("00000", plan, "================================================================================")
        
        // assign all commitments and nest them under the "publishes" key
        // commitments = [...plan.independentDemands]
        commitments = [...plan.independentDemands]
        
        let lastSeenProcessSpecification: any = undefined;
        let lastColumn: any = []
        // plan.processes.forEach((process: any) => {
          // for (let i = 0; i < simplifiedPlan.processes.length; i++) {
            processesToLoadCount = plan.processes.length
            for (const p of plan.processes) {
              getProcess.setVariables({
            id: p.id
          });
          let processRes: any = await getProcess.refetch()
          processesLoadedCount++
          let process = {...processRes.data.process}
          console.log(process)
          await delay(1000)
          // console.log(JSON.stringify(process.basedOn))
          // console.log(allColumns)
          // console.log(process)
          // try to get basedOn for each commitment

          // for (const commitment of process.committedOutputs) {
          //   console.log("commitment: ", commitment)
          //   const fullCommitment = await fetchCommitment(commitment.id)
          //   if (fullCommitment) {
          //     // commitment.clauseOf = fullCommitment.clauseOf
          //     // replace commitment with fullCommitment in the process
          //     process.committedInputs = [...process.committedOutputs.map(it => it.id == commitment.id ? {...it, clauseOf: fullCommitment.clauseOf} : it)]
          //   } else {
          //     console.log("what")
          //   }
          //   console.log("cost commitment: ", fullCommitment)
          //   await delay(100)
          // }

          for (const commitment of process.committedInputs) {
            console.log("commitment: ", commitment)
            const fullCommitment = await fetchCommitment(commitment.id)
            if (fullCommitment) {
              // commitment.clauseOf = fullCommitment.clauseOf
              // replace commitment with fullCommitment in the process
              process.committedInputs = [...process.committedInputs.map(it => it.id == commitment.id ? {...it, clauseOf: fullCommitment.clauseOf} : it)]
            } else {
              console.log("what")
            }
            console.log("cost commitment: ", fullCommitment)
            await delay(100)
          }

          lastColumn.unshift({
            ...process,
            basedOn: {
              image: processImages[process.basedOn.name],
              name: process.basedOn.name,
              id: process.basedOn.id,
            },
            committedInputs: [...process.committedInputs].reverse(),
            committedOutputs: [...process.committedOutputs].reverse(),
          })
          if (process.basedOn.id !=lastSeenProcessSpecification) {
            if (lastColumn.length > 0) {
              allColumns.unshift(lastColumn)
              lastColumn = []
            }
            lastSeenProcessSpecification = process.basedOn.id
          }
          console.log(lastColumn)
        }
        
        loadingPlan = false;
      } catch (e) {
        console.log("error", e)
        error = e
      }
    }
  })


  // ===========================================

  type Commitment = {
    resourceConformsTo: { name: string }
    resourceQuantity: { hasNumericalValue: string; hasUnit: { label: string } }
    receiver: { name: string }
    action: string
    id: string
  }
  let commitments: any[] = []

  let planModalOpen = false
  let commitmentModalOpen = false
  let economicEventModalOpen = false
  let selectedCommitmentId: string | undefined = undefined
</script>

<!-- {JSON.stringify(aggregatedCommitments)} -->



{#if plan}
<PlanModal bind:open={planModalOpen} planObject = {plan} {allColumns} {commitments} {commitmentsToDelete} editing={true}/>
{/if}

{#if economicEventModalOpen}
<EconomicEventModal
bind:open={economicEventModalOpen}
  {selectedCommitmentId}
  {commitmentModalProcess}
  {commitmentModalColumn}
  {commitmentModalSide}
  process = {currentProcess}
  bind:commitments
  on:submit={(event) => {
    saveEconomicEvent(event.detail.commitment, selectedProcessId, commitmentModalSide)
    let indexOfCommitment = allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide].findIndex(it => it.id == event.detail.commitment.id)
    yellow.push(event.detail.commitment.id)
    console.log("finished", event.detail.commitment.finished)
    allColumns[event.detail.column][event.detail.process][event.detail.side][indexOfCommitment] = event.detail.commitment
  }}
/>
{/if}

<CommitmentModal
  bind:open={commitmentModalOpen}
  {selectedCommitmentId}
  {commitmentModalProcess}
  {commitmentModalColumn}
  {commitmentModalSide}
  process = {currentProcess}
  bind:commitments
  on:submit={(event) => {
    console.log(allColumns)
    // console.log(event)
    // console.log(JSON.stringify(allColumns[event.detail.column][event.detail.process][event.detail.side][0].id))
    console.log("ID: ", event.detail.commitment.id)
    if (event.detail.useAs == "update") {
      if (event.detail.column == undefined) {
        commitments = commitments.map(it => it.id == event.detail.commitment.id ? event.detail.commitment : it)
        commitments = [...commitments]
      } else {
        let commitmentIndex = allColumns[event.detail.column][event.detail.process][event.detail.side].findIndex(it => it.id == event.detail.commitment.id)
        allColumns[event.detail.column][event.detail.process][event.detail.side][commitmentIndex] = {...event.detail.commitment}
      }
    } else {
      console.log(event.detail)
      if (event.detail.column == undefined) {
        commitments.push(event.detail.commitment)
        commitments = [...commitments]
      } else {
        console.log("adding commitment", event.detail.commitment)
        allColumns[event.detail.column][event.detail.process][event.detail.side].push(event.detail.commitment)
      }
    }

    allColumns = [...allColumns]
    // console.log(allColumns)
    // console.log(allColumns[event.detail.column][event.detail.process][event.detail.side])

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

{#if loadingPlan}
Loading {processesLoadedCount}/{processesToLoadCount} processes
{#if error}
  <br>
  {error}
{/if}
{:else}
<!-- plan name -->
<!-- plan name -->
<h1 class="text-center text-xl font-semibold">{plan.name}</h1>

<div class="flex justify-center items-center">
  <!-- <div class="outer-div justify-center items-center">
  <div class="scroll-div justify-center items-center">
  <div class="content-div flex space-x-8 mx-4"> -->
  <div class="flex space-x-8 mx-4 overflow-x-scroll">
    <div class="min-w-[200px]">
      <div class="flex justify-center" style="margin-top: 22px; margin-bottom: 22px">
        <button
          type="button"
          on:click={() => {
            planModalOpen = true
            // plan_created = true
          }}
          class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >Save changes</button
        >
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
      {@const { image, name } = processes[0].basedOn}
      {JSON.stringify(name)}
    {/each} -->
    {#each allColumns as processes, columnIndex}
    {@const { image, name } = processes[0].basedOn}
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
              selectedCommitmentId = undefined
            }}
                >
                <PlusCircle />
              </button>
                {#each committedInputs as { resourceConformsTo, provider, resourceQuantity, action, receiver, id, revisionId, agreement, fulfilledBy, finished, clauseOf }}
                  {@const color = finished ? "red" : (((fulfilledBy.length > 0) || yellow.includes(id)) ? "yellow" : "white")}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                    style="background-color: {color};"
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
                    {#if clauseOf}
                      {@const clause = clauseOf.commitments.find(it => it.action.label == "transfer")}
                        <p>
                          cost: {new Decimal(
                            clause.resourceQuantity.hasNumericalValue
                          )
                            .toFixed(2, Decimal.ROUND_HALF_UP)
                            .toString()}
                          {clause.resourceConformsTo.name}
                        </p>
                    {/if}
                    {#if false && fulfilledBy && fulfilledBy.length > 0}
                      <p>
                        fulfilled by: {fulfilledBy[0]}
                        finished: {finished}
                      </p>
                    {/if}
                    <div class="w-full flex justify-center">
                    {#if revisionId}
                      <button
                        on:click={() => {
                          commitmentModalProcess = processIndex
                          commitmentModalColumn = columnIndex
                          commitmentModalSide = "committedInputs"
                          selectedCommitmentId = id
                          selectedProcessId = processes[0].id
                          currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                          economicEventModalOpen = true
                        }}
                      >
                        <EconomicEvent/>
                      </button>
                    {/if}

                    <button
                      on:click={() => {
                        commitmentModalProcess = processIndex
                        commitmentModalColumn = columnIndex
                        commitmentModalSide = "committedInputs"
                        selectedCommitmentId = id
                        currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                        commitmentModalOpen = true
                      }}
                    >
                      <Pencil/>
                    </button>
                    <button
                      on:click={() => {
                        allColumns[columnIndex][processIndex].committedInputs = allColumns[columnIndex][processIndex].committedInputs.filter(it => it.id != id)
                        if (revisionId) {
                          commitmentsToDelete.push(revisionId)
                        }
                        console.log(commitmentsToDelete, revisionId)
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
                    // console.log(allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide][0].id)
                    commitmentModalOpen = true
                    // console.log(allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide][0].id)
                    selectedCommitmentId = undefined
                  }}
                >
                  <PlusCircle />
                </button>

                {#each committedOutputs as { resourceConformsTo, provider, resourceQuantity, action, receiver, id, revisionId, agreement, fulfilledBy, finished, clauseOf }}
                {@const color = finished ? "red" : (((fulfilledBy.length > 0) || yellow.includes(id)) ? "yellow" : "white")}
                <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                    style="background-color: {color};"
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
                      {#if clauseOf}
                        {@const clause = clauseOf.commitments.find(it => it.action.label == "transfer")}
                          <p>
                            cost: {new Decimal(
                              clause.resourceQuantity.hasNumericalValue
                            )
                              .toFixed(2, Decimal.ROUND_HALF_UP)
                              .toString()}
                            {clause.resourceConformsTo.name}
                          </p>
                      {/if}
                    </div>
                    <!-- {#if editable} -->
                      <div class="w-full flex justify-center">
                        {#if revisionId}
                          <button
                            on:click={() => {
                              commitmentModalProcess = processIndex
                              commitmentModalColumn = columnIndex
                              commitmentModalSide = "committedOutputs"
                              selectedCommitmentId = id
                              selectedProcessId = processes[0].id
                              currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                              economicEventModalOpen = true
                            }}
                          >
                            <EconomicEvent/>
                          </button>
                        {/if}
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
                          allColumns[columnIndex][processIndex].committedOutputs = allColumns[columnIndex][processIndex].committedOutputs.filter(it => it.id != id)
                          if (revisionId != undefined) {
                            commitmentsToDelete.push(revisionId)
                          }
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
            {#each commitments as c}
              <!-- {JSON.stringify(c)} -->
              {@const resourceConformsTo = c.resourceConformsTo}
              {@const resourceQuantity = c.resourceQuantity}
              {@const receiver = c.receiver}
              {@const id = c.id}
              {@const revisionId = c.revisionId}
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
                    on:click={() => {
                      (commitments = commitments.filter(it => it.id != id));
                      commitmentsToDelete.push(revisionId);
                    }}
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

  </div>
  <!-- </div>
  </div> -->
</div>
{/if}

<style>
  /* Custom CSS */
  .custom-background {
    background-image: url('/heading3.png');
    background-size: cover;
    background-position: center;
  }
</style>
