<script lang="ts">
  import OfferModal from './OfferModal.svelte'
  import { PROPOSAL_CORE_FIELDS, INTENT_CORE_FIELDS, PROPOSED_INTENT_CORE_FIELDS, PROPOSAL_RETURN_FIELDS } from '$lib/graphql/proposal.fragments'
  import { gql } from 'graphql-tag'
  import { onMount } from 'svelte'
  import { mutation, query } from 'svelte-apollo'
  import type { Unit, AgentConnection, Agent, Proposal, ProposalCreateParams, IntentCreateParams, IntentUpdateParams, UnitConnection, ResourceSpecification, ProposalConnection, ProposalUpdateParams, Intent } from '@leosprograms/vf-graphql'
  import { browser } from '$app/environment'
  import { deleteProposal, deleteIntent, deleteProposedIntent, updateProposal } from '../../crud/commit'
  import { getAllProposals, getAllResourceSpecifications, getAllUnits, getAllAgents } from '../../crud/fetch'
  import { allProposals, allResourceSpecifications, allUnits, allAgents, allHashChanges } from '../../crud/store'
  import { importProposals } from '../../crud/import'
  import Header from '$lib/Header.svelte'
  import Export from "$lib/Export.svelte"
  import Error from "$lib/Error.svelte"
  import Loading from '$lib/Loading.svelte'

  // externally provided data
  let units: Unit[];
  let resourceSpecifications: ResourceSpecification[];
  let agents: Agent[];
  let offersList: Proposal[] = [];

  // component UI state
  let modalOpen = false
  let editing = false;
  let usdRSpecId: string | undefined;
  let error: any;
  let name = ''
  let loading: boolean = true

  // Export
  let handleSubmit: any;
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

  allProposals.subscribe((res) => {
    offersList = res
    .filter(it => it.publishes?.find(it => !it.reciprocal)?.publishes?.provider)
    .map((p) => {
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

  // const UPDATE_PROPOSAL = gql`
  //   ${PROPOSAL_CORE_FIELDS},
  //   mutation($proposal: ProposalUpdateParams!){
  //     updateProposal(proposal: $proposal) {
  //       proposal {
  //         ...ProposalCoreFields
  //       }
  //     }
  //   }
  // `
  // let updateProposal: any = mutation(UPDATE_PROPOSAL)

  // DELETE PROPOSAL  
  // const DELETE_PROPOSAL = gql`mutation($revisionId: ID!){
  //   deleteProposal(revisionId: $revisionId)
  // }`
  // let deleteProposal: any = mutation(DELETE_PROPOSAL)

  async function deleteAProposal(revisionId: string) {
    let areYouSure = await confirm("Are you sure you want to delete this offer?")
    if (areYouSure == true) {
      // delete all intents associated with this proposal
      const proposal = offersList.find(p => p.revisionId === revisionId)
      if (proposal) {
        console.log(proposal)
        // for (const intent of proposal.publishes) {
          // console.log('deleting intent', intent)
          // await deleteIntent(intent.revisionId)
          // if (intent.publishes) {
          //   await deleteProposedIntent(intent.publishes.revisionId)
          // }
        // }
      }
      const res = await deleteProposal(revisionId)
      await getAllProposals()
    }
  }

  onMount(async () => {
    if (browser) {
      console.log('loading offers', offersList, units, resourceSpecifications, agents)
      loading = offersList.length === 0 //|| units.length === 0 || resourceSpecifications.length === 0 || agents.length === 0
      await getAllResourceSpecifications()
      await getAllAgents()
      await getAllUnits()
      await getAllProposals()
      loading = false
    }
  })

  $: currentProposal, currentIntent, currentProposedIntent, agents, units, resourceSpecifications, offersList, editing, modalOpen, name
</script>

<!-- <div style="height: 8vh"> -->
  <Header title="Offers" description="The goods or services you are offering within the network, now or generally." />
<!-- </div> -->

<Error {error} />

{#if loading}
<Loading />
{/if}

<OfferModal on:submit={getAllProposals} bind:open={modalOpen} bind:handleSubmit bind:editing bind:units bind:agents bind:resourceSpecifications bind:currentProposal bind:currentIntent bind:currentReciprocalIntent bind:currentProposedIntent />

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
        >Add an offer</button
      >
    </div>
    <Export bind:importing bind:open={exportOpen} dataName="list of offers" fileName="cfn-offers"
    data={offersList}
    on:import={async (event) => {
      await importProposals(event.detail)
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
                >Provider</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Offering</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Available quantity</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Price per unit</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Available</th
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
              {#if mainIntent && mainIntent.publishes.provider?.name}
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
                  >{mainIntent.publishes.provider?.name}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >{mainIntent.publishes.resourceConformsTo?.name}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >{availableQuantity.hasNumericalValue}
                  {availableQuantity.hasUnit?.label}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >{resourceQuantity.hasNumericalValue}
                  {proposedReciprocalIntent?.publishes.resourceConformsTo?.name}

                  / {mainIntent.publishes.resourceQuantity?.hasNumericalValue}
                  {availableQuantity.hasUnit?.label}
                  <!-- :TODO: display associated label for default transaction currency loaded from `Unit` query API via `usdId` -->
                  </td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <input
                    on:change={(e) => {
                      if (e.target.checked) {

                        let proposal = {
                          revisionId: p.revisionId,
                          hasBeginning: p.hasBeginning,
                          hasEnd: null,
                        };


                        updateProposal(proposal);

                        getAllProposals();
                      } else {
                        let proposal = {
                          revisionId: p.revisionId,
                          hasBeginning: p.hasBeginning,
                          hasEnd: new Date(),
                        };

                        updateProposal(proposal);

                        getAllProposals();
                      }
                    }}
                    id="candidates"
                    aria-describedby="candidates-description"
                    name="candidates"
                    type="checkbox"
                    checked={!p.hasEnd || (new Date() < p.hasEnd)}
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
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
