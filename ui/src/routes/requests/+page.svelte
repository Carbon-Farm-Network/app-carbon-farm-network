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
  import { getAllProposals, getAllResourceSpecifications, getAllUnits, getAllAgents } from '../../utils'
  import { allProposals, allResourceSpecifications, allUnits, allAgents, allHashChanges } from '../../store'
  import { loop_guard } from 'svelte/internal'
  import ResourceSpecificationModal from '$lib/ResourceSpecificationModal.svelte'
  import Header from '$lib/Header.svelte'
  import Export from "$lib/Export.svelte"
  import Error from "$lib/Error.svelte"

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
  let error: any;

  // Export
  let exportOpen = false;
  let importing = false;
  let createRequest: any;
  let hashChanges: any = {}
  allHashChanges.subscribe((res) => {
    hashChanges = res
  })
  
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

  allProposals.subscribe((res) => {
    offersList = res.map((p) => {
      return {
        ...p,
        publishes: p.publishes.map((i) => {
          return {
            ...i,
            action: i.action,
            atLocation: i.atLocation,
            availableQuantity: i.availableQuantity,
            effortQuantity: i.effortQuantity,
            resourceQuantity: i.resourceQuantity,
            inScopeOf: i.inScopeOf,
            inputOf: i.inputOf,
            outputOf: i.outputOf,
            provider: i.provider,
            receiver: i.receiver,
            resourceConformsTo: i.resourceConformsTo,
            resourceInventoriedAs: i.resourceInventoriedAs,
          }
        })
      }
    })
  })

  allResourceSpecifications.subscribe((res) => {
    resourceSpecifications = res
  })

  allUnits.subscribe((res) => {
    units = res
  })

  allAgents.subscribe((res) => {
    agents = res.map((a) => {
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
  })

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
      await getAllProposals()
    }
  }
  // DELETE PROPOSAL ENDS

  onMount(async () => {
    if (browser) {
      await getAllResourceSpecifications()
      await getAllAgents()
      await getAllUnits()
      await getAllProposals()
    }
  })

  $: currentProposal, currentIntent, currentProposedIntent, agents, units, resourceSpecifications, offersList, editing, modalOpen, name
</script>


<!-- <div style="height: 8vh"> -->
  <Header title="Requests" description="The goods or services you are requesting within the network, now or generally." />
  <!-- </div> -->
  
<Error {error} />

<RequestModal bind:createRequest on:submit={getAllProposals} bind:open={modalOpen} bind:editing bind:units bind:agents bind:resourceSpecifications bind:currentProposal bind:currentIntent bind:currentReciprocalIntent bind:currentProposedIntent />

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
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a request</button
      >
    </div>
    <Export dataName="list of requests" fileName="cfn-requests" 
      data={offersList} 
      bind:open={exportOpen}
      bind:importing
      on:import={async (event) => {
        // importData(event.detail)
        console.log("importing data", event.detail)
        for (let i = 0; i < event.detail.length; i++) {
          console.log(event.detail[i])
          let currentIntent = event.detail[i].publishes.find(({ reciprocal }) => !reciprocal).publishes
          if (currentIntent.receiver) {
            let currentReciprocalIntent = event.detail[i].publishes.find(({ reciprocal }) => reciprocal).publishes
            console.log(currentIntent, currentReciprocalIntent)
            currentReciprocalIntent.action = currentReciprocalIntent.action.id
            console.log(currentIntent.resourceConformsTo)
            currentReciprocalIntent.resourceConformsTo = hashChanges[currentIntent.resourceConformsTo.id]
            console.log("********************************", currentReciprocalIntent)
            if (!currentReciprocalIntent.receiver) { importing = false; error = "Stopped import due to dependency data"; return }
            console.log("receiver", currentIntent.receiver, hashChanges)
            currentReciprocalIntent.receiver = hashChanges[currentReciprocalIntent.receiver.id]
            if (!currentReciprocalIntent.receiver) { importing = false; error = "Stopped import due to dependency data"; return }
            console.log(currentReciprocalIntent)
            currentReciprocalIntent.resourceQuantity = {
              hasNumericalValue: currentReciprocalIntent.resourceQuantity.hasNumericalValue,
              hasUnit: currentIntent.resourceQuantity.hasUnit?.id
            }
            currentIntent.resourceQuantity = {
              hasNumericalValue: currentIntent.resourceQuantity.hasNumericalValue,
              hasUnit: currentIntent.resourceQuantity.hasUnit.id
            }
            currentIntent.action = currentIntent.action.id
            currentIntent.receiver = hashChanges[currentIntent.receiver.id]
            if (!currentIntent.receiver) { importing = false; error = "Stopped import due to dependency data"; return }
            currentIntent.resourceConformsTo = hashChanges[currentIntent.resourceConformsTo.id]
            if (!currentIntent.resourceConformsTo) { importing = false; error = "Stopped import due to dependency data"; return }
            currentReciprocalIntent.action = currentReciprocalIntent.action.id
            currentIntent.availableQuantity = {
              hasNumericalValue: currentIntent.availableQuantity.hasNumericalValue,
              hasUnit: currentIntent.availableQuantity.hasUnit.id
            }
            currentIntent.resourceQuantity = {
              hasNumericalValue: currentIntent.resourceQuantity.hasNumericalValue,
              hasUnit: currentIntent.resourceQuantity.hasUnit.id
            }
            var d = new Date(Date.now());
            let newProposal = {
              hasBeginning: event.detail[i].hasBeginning,
              unitBased: event.detail[i].unitBased,
              note: event.detail[i].note
            }
            console.log(currentIntent, currentReciprocalIntent)
            let res = await createRequest(newProposal, currentIntent, currentReciprocalIntent)
          }
        }
        await getAllProposals()
        importing = false
        exportOpen = false
      }}
      />
    {:else}
    <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
      <button
        type="button"
        class="block rounded-md bg-gray-400 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
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
            {#each offersList as p, index}
              {@const mainIntent = p.publishes?.find(({ reciprocal }) => !reciprocal)}
              {#if mainIntent && mainIntent.publishes.receiver?.name}
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
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3">
                  {mainIntent.publishes.receiver?.name}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {mainIntent.publishes.resourceConformsTo?.name}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {mainIntent.publishes.resourceQuantity?.hasNumericalValue}
                  {availableQuantity.hasUnit?.label}
                  <!-- :TODO: display associated label for default transaction currency loaded from `Unit` query API via `usdId` -->
                </td>

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
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
