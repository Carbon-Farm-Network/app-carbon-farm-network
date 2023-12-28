<script lang="ts">
  import recipes from '$lib/data/recipes-with-exchanges.json'
  // import requests from '$lib/data/requests.json'
  // import offers from '$lib/data/offers.json'
  import agents from '$lib/data/agents.json'
  import { Decimal } from 'decimal.js'
  import PlanModal from '$lib/PlanModal.svelte'
  import CommitmentModal from '$lib/CommitmentModal.svelte'
  import { Trash, Pencil, PlusCircle } from '$lib/icons'
  import { page } from '$app/stores';

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
  let currentProcess: any[];

  let planId = ''
  $: if ($page.params.plan_id) {
    planId = $page.params.plan_id;
  }

  $: allColumns, commitmentModalColumn, commitmentModalProcess, commitmentModalSide, currentProcess, commitmentModalOpen;

  let plan: any = undefined;

  let requests: Proposal[] = [];
  let offers: Proposal[] = [];
  let proposalsList: Proposal[] = []
  let createPlan: PlanCreateParams = {
    name: '',
    note: '',
  }
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
    query GetPlan($id: ID!) {
      plan(id: $id) {
        id
        revisionId
        name
        meta {
          retrievedRevision {
            id
            time
          }
        }
        independentDemands {
          id
          receiver {
            id
            name
          }
          resourceQuantity {
            hasNumericalValue
            defaultUnitOfResource {
              label
            }
          }
          resourceConformsTo {
            id
            name
          }
        }
        processes {
          id
          name
          meta {
            retrievedRevision {
              id
              time
            }
          }
          basedOn {
            id
            name
          }
          committedInputs {
            id
            meta {
              retrievedRevision {
                id
                time
              }
            }
            provider {
              id
              name
            }
            receiver {
              id
              name
            }
            resourceQuantity {
              hasNumericalValue
            	defaultUnitOfResource {
              	label
            	}
            }
            resourceConformsTo {
              id
              name
              defaultUnitOfResource {
                label
              }
            }
          }
          committedOutputs {
            id
            meta {
              retrievedRevision {
                id
                time
              }
            }
            provider {
              id
              name
            }
            receiver {
              id
              name
            }
            resourceQuantity {
              hasNumericalValue
            	defaultUnitOfResource {
              	label
            	}
            }
            resourceConformsTo {
              id
              name
            }
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
  let getPlan: ReadableQuery<PlanQueryResponse> = query(GET_PLAN);

  // let getPlan: ReadableQuery<ProposalsQueryResponse> = query(GET_PLAN)

  async function fetchProposals() {
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
  }

  onMount(async () => {
    if (browser) {
      fetchProposals()
      
      console.log(planId)
      getPlan.setVariables({
        id: planId
      });
      const res = await getPlan.refetch()
      plan = res.data.plan
      console.log(plan)
      
      let lastSeenProcessSpecification: any = undefined;
      let lastColumn: any = []
      plan.processes.forEach((process: any) => {
        console.log(JSON.stringify(process.basedOn))
        console.log(allColumns)
        console.log(process)
        lastColumn.unshift({
          ...process,
          basedOn: {
            image: "/farm.svg",
            name: "Column"
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
      })

      loadingPlan = false;
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
  let commitments: Commitment[] = []

  let planModalOpen = false
  let commitmentModalOpen = false
  let selectedCommitmentId: string | undefined = undefined
</script>

<!-- {JSON.stringify(aggregatedCommitments)} -->



<PlanModal bind:open={planModalOpen} planObject = {createPlan} {allColumns} {commitments}/>
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
    console.log(JSON.stringify(allColumns[event.detail.column][event.detail.process][event.detail.side]))
    console.log("ID: ", event.detail.commitment.id)
    let commitmentIndex = allColumns[event.detail.column][event.detail.process][event.detail.side].findIndex(it => it.id == event.detail.commitment.id)
    if (commitmentIndex == -1) {
      console.log("1")
      allColumns[event.detail.column][event.detail.process][event.detail.side].push(event.detail.commitment)
    } else {
      console.log("2")
      allColumns[event.detail.column][event.detail.process][event.detail.side][commitmentIndex] = {...event.detail.commitment}
    }

    allColumns = [...allColumns]
    console.log(allColumns)
    console.log(allColumns[event.detail.column][event.detail.process][event.detail.side])

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
Loading plan...
{:else}
<!-- plan name -->
<!-- plan name -->
<h1>{plan.name}</h1>

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
            }}
                >
                <PlusCircle />
              </button>

                {#each committedInputs as { resourceConformsTo, provider, resourceQuantity, action, receiver, id, agreement }}
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
                        {action}
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
                      <!-- <button
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
                    </button> -->
                    <button
                      on:click={() => {
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
                          {action}
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
                        <!-- <button
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
                      </button> -->
                      <button
                        on:click={() => {
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
                    {action}
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
