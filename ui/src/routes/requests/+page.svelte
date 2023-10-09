<script lang="ts">
  import RequestModal from '$lib/RequestModal.svelte'
  import offers from '$lib/data/offers.json'
  import { DateInput } from 'date-picker-svelte'
  import { PROPOSAL_CORE_FIELDS, INTENT_CORE_FIELDS, PROPOSED_INTENT_CORE_FIELDS, PROPOSAL_RETURN_FIELDS } from '$lib/graphql/proposal.fragments'
  import { RESOURCE_SPECIFICATION_CORE_FIELDS, UNIT_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'
  import { AGENT_CORE_FIELDS, PERSON_CORE_FIELDS, ORGANIZATION_CORE_FIELDS } from '$lib/graphql/agent.fragments'
  import type { RelayConn } from '$lib/graphql/helpers'
  import { gql } from 'graphql-tag'
  import type { ReadableQuery } from 'svelte-apollo'
  import { onMount } from 'svelte'
  import { mutation, query } from 'svelte-apollo'
  import { createEventDispatcher } from 'svelte';
  import type { Unit, AgentConnection, Agent, Proposal, ProposalCreateParams, IntentCreateParams, IntentUpdateParams, UnitConnection, ResourceSpecification, ProposalConnection, ProposalUpdateParams, Intent } from '@valueflows/vf-graphql'
  import { flattenRelayConnection } from '$lib/graphql/helpers'
  import { browser } from '$app/environment'
  import { loop_guard } from 'svelte/internal'
  import ResourceSpecificationModal from '$lib/ResourceSpecificationModal.svelte'
  import Header from '$lib/Header.svelte'

  // externally provided data
  let units: Unit[];
  let resourceSpecifications: ResourceSpecification[];
  let agents: Agent[];
  let offersList: Proposal[] = [];

  // component UI state
  let modalOpen = false
  let editing = false;
  let usdRSpecId: string | undefined;
  let name = ''

  // Valueflows data state
  let currentProposal: any = {};
  let currentIntent: IntentUpdateParams = makeEmptyIntent()
  let currentReciprocalIntent: IntentUpdateParams = makeEmptyIntent()
  // let currentReciprocalIntent: IntentCreateParams = {
  //   action: "transfer",
  //   resourceQuantity:  { hasNumericalValue: 0 },
  //   resourceConformsTo: "USD",  // set upon assigning `usdRSpecId`
  // };
  let _defaultReciprocalIntent: IntentUpdateParams = {
    ...currentReciprocalIntent,
    resourceQuantity: Object.assign({}, currentReciprocalIntent.resourceQuantity),
  }
  let currentProposedIntent: any = {};

  // GraphQL bindings

  const GET_ALL_RESOURCE_SPECIFICATIONS = gql`
    ${RESOURCE_SPECIFICATION_CORE_FIELDS}
    ${UNIT_CORE_FIELDS}
    query {
      resourceSpecifications(last: 100000) {
        edges {
          cursor
          node {
            ...ResourceSpecificationCoreFields
            defaultUnitOfResource {
              ...UnitCoreFields
            }
          }
        }
      }
    }
  `

  const GET_UNITS = gql`
    query GetUnits {
      units {
        edges {
          cursor
          node {
            id
            label
            symbol
          }
        }
      }
    }
  `

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
    resourceSpecifications: AgentConnection & RelayConn<any>
  }

  interface UnitsQueryResponse {
    units: UnitConnection & RelayConn<any> //& RelayConn<unknown> | null | undefined
  }
  let getUnits: ReadableQuery<UnitsQueryResponse> = query(GET_UNITS)

  interface QueryResponse {
    resourceSpecifications: AgentConnection & RelayConn<any>
  }

  interface OffersQueryResponse {
    proposals: ProposalConnection & RelayConn<any>
  }

  let getOffers: ReadableQuery<OffersQueryResponse> = query(GET_All_PROPOSALS)

  let resourceSpecificationsQuery: ReadableQuery<QueryResponse> = query(GET_ALL_RESOURCE_SPECIFICATIONS)

  function makeEmptyIntent(): IntentUpdateParams {
    return {
      revisionId: '',
      action: 'transfer',
      availableQuantity: { hasNumericalValue: 0 },
      effortQuantity: { hasNumericalValue: 0 },
      resourceQuantity: { hasNumericalValue: 0 },
      provider: "",
      receiver: "",
      resourceConformsTo: "",
      note: "",
    }
  }

  // // helper to assign `Unit` identifiers to `Intent` data after binding to pre-created `Unit` records from GraphQL
  // function assignUSDId(intent: IntentUpdateParams) {
  //   if (intent.resourceConformsTo === "USD") {
  //     intent.resourceConformsTo = usdRSpecId
  //   }
  // }

  async function fetchResourceSpecifications() {
    resourceSpecificationsQuery.getCurrentResult()

    resourceSpecificationsQuery.refetch().then((r) => {
      resourceSpecifications = flattenRelayConnection(r.data?.resourceSpecifications)
      resourceSpecifications.forEach((a) => {
        // assign USD `Unit` identifiers when loaded
        if (a.name === "USD") {
          usdRSpecId = a.id

          // override / set USD reference in Intent data payloads
          // assignUSDId(_defaultReciprocalIntent)
          // assignUSDId(currentReciprocalIntent)
          _defaultReciprocalIntent.resourceConformsTo = usdRSpecId;
          currentReciprocalIntent.resourceConformsTo = usdRSpecId;
        }
      })
    })
  }

  const GET_ALL_AGENTS = gql`
    ${AGENT_CORE_FIELDS}
    ${PERSON_CORE_FIELDS}
    ${ORGANIZATION_CORE_FIELDS}
    query {
      agents(last: 100000) {
        edges {
          cursor
          node {
            ...AgentCoreFields
            ...PersonCoreFields
            ...OrganizationCoreFields
          }
        }
      }
    }
  `

  const UPDATE_PROPOSAL = gql`
    ${PROPOSAL_CORE_FIELDS},
    mutation($proposal: ProposalUpdateParams!){
      updateProposal(proposal: $proposal) {
        proposal {
          ...ProposalCoreFields
        }
      }
    }
  `
  let updateProposal: any = mutation(UPDATE_PROPOSAL)

  interface QueryResponse {
    agents: AgentConnection & RelayConn<any>
  }

  // map component state
  let agentsQuery: ReadableQuery<QueryResponse> = query(GET_ALL_AGENTS)

  async function fetchAgents() {
    agentsQuery.refetch().then((r) => {
      agents = flattenRelayConnection(r.data?.agents).map((a) => {
        return {
          ...a,
          "name": a.name,
          "imageUrl": a.image,
          "iconUrl": a.image,
          "latLng": {lat: a.classifiedAs[0], lon: a.classifiedAs[1]},
          "role": a.classifiedAs[2],
          "address": a.note,
        }
      })
      // console.log(agents)
    })
  }

  async function fetchUnits() {
    getUnits.getCurrentResult()
    getUnits.refetch().then((r) => {
      if (r.data?.units.edges.length > 0) {
        units = flattenRelayConnection(r.data?.units)
      }
    })
  }

  async function fetchOffers() {
    await getOffers.getCurrentResult()
    await getOffers.refetch().then((r) => {
      if (r.data?.proposals.edges.length > 0) {
        offersList = flattenRelayConnection(r.data?.proposals)
        console.log(offersList)
      }
    })
  }

  // DELETE PROPOSAL  
  const DELETE_PROPOSAL = gql`mutation($revisionId: ID!){
    deleteProposal(revisionId: $revisionId)
  }`
  let deleteProposal: any = mutation(DELETE_PROPOSAL)

  async function deleteAProposal(revisionId: string) {
    let areYouSure = await confirm("Are you sure you want to delete this request?")
    if (areYouSure == true) {
      const res = await deleteProposal({ variables: { revisionId } })
      console.log(res)
      await fetchOffers()
    }
  }
  // DELETE RESOURCE SPECIFICATION ENDS

  onMount(() => {
    if (browser) {
      fetchResourceSpecifications()
      fetchAgents()
      fetchUnits()
      fetchOffers()
      // setInterval(function(){
      //   if (!units) {
      //     fetchUnits()
      //   } else {

      //   }
      // }, 10000)
      // console.log(offers)
    }
  })

  $: currentProposal, currentIntent, currentProposedIntent, agents, units, resourceSpecifications, offersList, editing, modalOpen, name
</script>

<div style="height: 8vh">
  <Header title="Requests" description="The goods or services you are requesting within the network, now or generally." />
</div>

<RequestModal on:submit={fetchOffers} bind:open={modalOpen} bind:editing bind:units bind:agents bind:resourceSpecifications bind:currentProposal bind:currentIntent bind:currentReciprocalIntent bind:currentProposedIntent />

<div class="p-12">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <!-- <h1 class="text-base font-semibold leading-6 text-gray-900">Offers</h1>
      <p class="mt-2 text-sm text-gray-700">
        The goods or services you are offering within the network, now or generally.
      </p> -->
    </div>
    {#if agents && resourceSpecifications && units}
    <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
      <button
        type="button"
        on:click={() => {
          currentProposal = {hasBeginning: new Date()};
          currentIntent = makeEmptyIntent()
          currentReciprocalIntent = _defaultReciprocalIntent
          currentProposedIntent = {}
          modalOpen = true
          editing = false
        }}
        class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a request</button
      >
    </div>
    {:else}
    <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
      <button
        type="button"
        class="block rounded-md bg-indigo-300 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Loading data...</button
      ></div>
    {/if}
  </div>
  <div class="mt-8 flow-root">
    <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
        <table class="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th
                scope="col"
                class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                >Receiver</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Requesting</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Quantity</th
              >
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white">
            <!-- {#each offers as { proposed_intents }, index} -->
            {#if offersList}
            {#each offersList as p, index}
              {@const mainIntent = p.publishes?.find(({ reciprocal }) => !reciprocal)}
              {#if mainIntent}
              {@const proposedReciprocalIntent = p.publishes?.find(
                ({ reciprocal }) => reciprocal
              )}
              {@const availableQuantity = mainIntent.publishes.availableQuantity}
              {@const resourceQuantity = (proposedReciprocalIntent && proposedReciprocalIntent.publishes) ? proposedReciprocalIntent.publishes.resourceQuantity : {
                ...currentReciprocalIntent.resourceQuantity,
                hasUnit: null,  // previously 'each' in older VF (< 0.6) spec
              }}
              {#if mainIntent && availableQuantity && resourceQuantity}
              <tr class={index % 2 == 0 ? 'bg-gray-100' : ''}>
                <td
                  class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3"
                  >{mainIntent.publishes.receiver?.name}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >{mainIntent.publishes.resourceConformsTo?.name}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >
                  {mainIntent.publishes.resourceQuantity?.hasNumericalValue}
                  {availableQuantity.hasUnit?.label}
                  <!-- :TODO: display associated label for default transaction currency loaded from `Unit` query API via `usdId` -->
                  </td
                >

                <td
                  class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
                >
                <button type="button" on:click={() => {
                  currentProposal = {
                    revisionId: p.revisionId,
                    hasBeginning: p.hasBeginning,
                    note: p.note
                  };
                  const mi = mainIntent.publishes
                  currentIntent = {
                    ...mi,
                    action: mi.action?.id,
                    atLocation: mi.atLocation?.id || currentReciprocalIntent.atLocation,
                    availableQuantity: mi.availableQuantity ? {
                      hasNumericalValue: mi.availableQuantity.hasNumericalValue,
                      hasUnit: mi.availableQuantity.hasUnit?.id,
                    } : undefined,
                    effortQuantity: mi.effortQuantity ? {
                      hasNumericalValue: mi.effortQuantity.hasNumericalValue,
                      hasUnit: mi.effortQuantity.hasUnit?.id,
                    } : undefined,
                    resourceQuantity: mi.resourceQuantity ? {
                      hasNumericalValue: mi.resourceQuantity.hasNumericalValue,
                      hasUnit: mi.resourceQuantity.hasUnit?.id,
                    } : undefined,
                    inScopeOf: (mi.inScopeOf || []).map(s => s.id),
                    inputOf: mi.inputOf?.id,
                    outputOf: mi.outputOf?.id,
                    provider: mi.provider?.id,
                    receiver: mi.receiver?.id,
                    resourceConformsTo: mi.resourceConformsTo?.id,
                    resourceInventoriedAs: mi.resourceInventoriedAs?.id,
                  }
                  console.log('SET TO', currentIntent)
                  if (proposedReciprocalIntent) {
                    const pi = proposedReciprocalIntent.publishes
                    currentReciprocalIntent = {
                      ...pi,
                      action: pi.action?.id || currentReciprocalIntent.action,
                      atLocation: pi.atLocation?.id || currentReciprocalIntent.atLocation,
                      availableQuantity: pi.availableQuantity ? {
                        hasNumericalValue: pi.availableQuantity.hasNumericalValue,
                        hasUnit: pi.availableQuantity.hasUnit?.id,
                      } : undefined,
                      effortQuantity: pi.effortQuantity ? {
                        hasNumericalValue: pi.effortQuantity.hasNumericalValue,
                        hasUnit: pi.effortQuantity.hasUnit?.id,
                      } : undefined,
                      resourceQuantity: pi.resourceQuantity ? {
                        hasNumericalValue: pi.resourceQuantity.hasNumericalValue,
                        hasUnit: pi.resourceQuantity.hasUnit?.id,
                      } : undefined,
                      inScopeOf: (pi.inScopeOf || []).map(s => s.id),
                      inputOf: pi.inputOf?.id,
                      outputOf: pi.outputOf?.id,
                      provider: pi.provider?.id,
                      receiver: pi.receiver?.id,
                      resourceConformsTo: pi.resourceConformsTo?.id,
                      resourceInventoriedAs: pi.resourceInventoriedAs?.id,
                    }
                  }
                  currentProposedIntent = {}

                  modalOpen = true;
                  editing = true;
                }}  class="text-indigo-600 hover:text-indigo-900"
                  >Edit<span class="sr-only">, Lindsay Walton</span></button
                >
                &nbsp;
                <button type="button" on:click={() => {
                  deleteAProposal(p.revisionId)
                }}
                class="text-indigo-600 hover:text-indigo-900">
                Delete</button>
                </td>
              </tr>
              {/if}
              {/if}
            {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
