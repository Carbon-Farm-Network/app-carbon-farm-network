<script lang="ts">
  import { DateInput } from 'date-picker-svelte'
  import { PROPOSAL_CORE_FIELDS, INTENT_CORE_FIELDS, PROPOSED_INTENT_CORE_FIELDS } from '$lib/graphql/proposal.fragments'
  import { RESOURCE_SPECIFICATION_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'
  import type { RelayConn } from '$lib/graphql/helpers'
  import { gql } from 'graphql-tag'
  import type { ReadableQuery } from 'svelte-apollo'
  import { clickOutside } from '../utils'
  import { onMount } from 'svelte'
  import { mutation, query } from 'svelte-apollo'
  import { createEventDispatcher } from 'svelte';
  import type { Agent, ProposalCreateParams, Intent, IntentCreateParams, IntentUpdateParams, ResourceSpecification,IMeasure } from '@valueflows/vf-graphql'
  import { flattenRelayConnection } from '$lib/graphql/helpers'
  import { browser } from '$app/environment'
  import ResourceSpecificationModal from './ResourceSpecificationModal.svelte'

  // public CustomElement attributes
  export let open = false;
  export let name = "";
  export let resourceSpecifications: any[];
  export let units: any[];
  export let agents: any[];
  export let date = new Date();
  export let currentProposal: any;
  export let currentIntent: IntentUpdateParams;
  export let currentReciprocalIntent: IntentUpdateParams;
  export let currentProposedIntent: any;
  export let editing: boolean;
  
  function checkKey(e: any) {
    if (e.key === "Escape" && !e.shiftKey) {
      e.preventDefault();
      open = false;
    }
  }

  onMount(() => {
    window.addEventListener("keydown", checkKey);
  });

  let submitting: boolean = false;
  let xyz: boolean = false;
  
  const dispatch = createEventDispatcher();

  // GraphQL query bindings

  const ADD_PROPOSAL = gql`
    ${PROPOSAL_CORE_FIELDS},
    mutation($proposal: ProposalCreateParams!){
      createProposal(proposal: $proposal) {
        proposal {
          ...ProposalCoreFields
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

  const ADD_INTENT = gql`
    ${INTENT_CORE_FIELDS},
    mutation($intent: IntentCreateParams!){
      createIntent(intent: $intent) {
        intent {
          ...IntentCoreFields
        }
      }
    }
  `

  const UPDATE_INTENT = gql`
    ${INTENT_CORE_FIELDS},
    mutation($intent: IntentUpdateParams!){
      updateIntent(intent: $intent) {
        intent {
          ...IntentCoreFields
        }
      }
    }
  `

  const ADD_PROPOSED_INTENT = gql`
    ${PROPOSED_INTENT_CORE_FIELDS},
    mutation($reciprocal: Boolean, $publishedIn: ID!, $publishes: ID!){
      proposeIntent(reciprocal: $reciprocal, publishedIn: $publishedIn, publishes: $publishes) {
        proposedIntent {
          ...ProposedIntentCoreFields
        }
      }
    }
  `

  let addProposal: any= mutation(ADD_PROPOSAL)
  let updateProposal: any= mutation(UPDATE_PROPOSAL)
  let addIntent: any= mutation(ADD_INTENT)
  let updateIntent: any= mutation(UPDATE_INTENT)
  let addProposedIntent: any= mutation(ADD_PROPOSED_INTENT)

  // helper to workaround direct bind:value syntax coercing things to strings
  function parseFormValues(val: IMeasure) {
    if (val.hasNumericalValue || val.hasNumericalValue === "0") val.hasNumericalValue = parseFloat(val.hasNumericalValue)
    // also add hasUnit
    if (val.hasUnit) val.hasUnit = val.hasUnit
    return val
  }

  export async function createRequest(proposal: any, localIntent: any, localReciprocalIntent: any) {
    
    console.log("1")
    const res1 = await addProposal({ variables: { proposal } })
    console.log("2")
    const res1ID: String = String(res1.data.createProposal.proposal.id)

    // create intent
    const intent: IntentCreateParams = {
      action: localIntent.action as string,
      resourceConformsTo: localIntent.resourceConformsTo || undefined,
      resourceInventoriedAs: localIntent.resourceInventoriedAs || undefined,
      inScopeOf: localIntent.inScopeOf || undefined,
      inputOf: localIntent.inputOf || undefined,
      outputOf: localIntent.outputOf || undefined,
      provider: localIntent.provider || undefined,
      receiver: localIntent.receiver || undefined,
      note: localIntent.note || undefined,
      resourceQuantity: localIntent.resourceQuantity ? parseFormValues(localIntent.resourceQuantity as IMeasure) : undefined,
      availableQuantity: localIntent.availableQuantity ? parseFormValues(localIntent.availableQuantity as IMeasure) : undefined,
      effortQuantity: localIntent.effortQuantity ? parseFormValues(localIntent.effortQuantity as IMeasure) : undefined,
    }
    if (intent.resourceQuantity) {
      intent.resourceQuantity.hasUnit = localIntent.availableQuantity?.hasUnit
    }
    console.info(intent)
    const res2 = await addIntent({ variables: { intent } });
    const res2ID = res2.data.createIntent.intent.id
    console.log(res2);

    // create reciprocal intent
    const recipIntent = {
      provider: localIntent.receiver,
      action: "transfer",
      resourceConformsTo: localIntent.resourceConformsTo,
      resourceQuantity: localReciprocalIntent.resourceQuantity ? parseFormValues(localReciprocalIntent.resourceQuantity as IMeasure) : undefined,
    }
    console.info(recipIntent)
    const res3 = await addIntent({ variables: { intent: recipIntent } })
    const res3ID: String = String(res3.data.createIntent.intent.id)
    console.log(res3);


    let reciprocal: Boolean = false
    let publishedIn = res1ID
    let publishes = res2ID

    const res4 = await addProposedIntent({ variables: { reciprocal, publishedIn, publishes } })
    console.log(res4)

    reciprocal = true
    publishes = res3ID

    const res5 = await addProposedIntent({ variables: { reciprocal, publishedIn, publishes } })
    console.log(res5)
  }

  async function handleSubmit2() {
    console.log(currentProposal)
    console.log(currentIntent)
    console.log(currentReciprocalIntent)
    console.log(currentProposedIntent)
    try {
      submitting = true;
      submitting = submitting;
      console.log("submitting", submitting)
    }
    catch (error) {
      console.error(error)
    }
  }

  async function handleSubmit() {
    console.log(currentProposal)
    console.log(currentIntent)
    console.log(currentReciprocalIntent)
    console.log(currentProposedIntent)
    try {
      submitting = true;

      await new Promise(r => setTimeout(r, 1000));

      submitting = submitting;
      console.log("submitting", submitting)
      // create proposal
      var d = new Date(Date.now());
      let proposal: ProposalCreateParams = {
        hasBeginning: d,
        unitBased: true,
        note: "shearing end of May"
      }
      await createRequest(proposal, currentIntent, currentReciprocalIntent)
      dispatch("submit");
      submitting = false;
      open = false;
      // console.log(res1)
      // console.log(res2)
      // console.log(res3)
      // console.log(res4)
    } catch (error) {
      console.error(error)
    }
  }

  async function handleUpdate() {
    submitting = true;
    // console.log(currentProposal)
    let proposal = currentProposal
    await updateProposal({ variables: { proposal: proposal } })
    // let intent = currentIntent
    let intent = {
      revisionId: currentIntent.revisionId,
      action: currentIntent.action as string,
      resourceConformsTo: currentIntent.resourceConformsTo || undefined,
      resourceInventoriedAs: currentIntent.resourceInventoriedAs || undefined,
      inScopeOf: currentIntent.inScopeOf || undefined,
      inputOf: currentIntent.inputOf || undefined,
      outputOf: currentIntent.outputOf || undefined,
      provider: currentIntent.provider || undefined,
      note: currentIntent.note || undefined,
      resourceQuantity: currentIntent.resourceQuantity ? parseFormValues(currentIntent.resourceQuantity as IMeasure) : undefined,
      availableQuantity: currentIntent.availableQuantity ? parseFormValues(currentIntent.availableQuantity as IMeasure) : undefined,
      effortQuantity: currentIntent.effortQuantity ? parseFormValues(currentIntent.effortQuantity as IMeasure) : undefined,
    }
    if (intent.resourceQuantity) {
      intent.resourceQuantity.hasUnit = currentIntent.availableQuantity?.hasUnit
    }
    console.log(intent)
    const res = await updateIntent({ variables: { intent: intent } })
    console.log(res)

    let intent2 = {
      receiver: currentIntent.receiver,
      revisionId: currentReciprocalIntent.revisionId,
      action: currentReciprocalIntent.action as string,
      resourceConformsTo: currentReciprocalIntent.resourceConformsTo,
      resourceQuantity: currentReciprocalIntent.resourceQuantity ? parseFormValues(currentReciprocalIntent.resourceQuantity as IMeasure) : undefined,
    }
    // if (intent2.resourceQuantity) {
    //   intent2.resourceQuantity.hasUnit = intent2.availableQuantity?.hasUnit
    // }
    console.log(intent2)
    const res2 = await updateIntent({ variables: { intent: intent2 } })
    dispatch("submit");
    console.log(res2)
    submitting = false;
    open = false;
  }


  onMount(() => {
    // let x = cri1()
    // console.log(x)
    if (browser) {
      console.log(currentIntent)
    }
    // handleSubmit()
  })

  $: currentProposal, currentIntent, currentReciprocalIntent, currentProposedIntent, submitting
  $: isOfferValid = true && !submitting && currentIntent && currentIntent.receiver && currentIntent.resourceConformsTo; // && currentIntent.note;
</script>

<div class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
  <!--
    Background backdrop, show/hide based on modal state.

    Entering: "ease-out duration-300"
      From: "opacity-0"
      To: "opacity-100"
    Leaving: "ease-in duration-200"
      From: "opacity-100"
      To: "opacity-0"
  -->
  <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" class:hidden={!open}/>

  <div class="fixed inset-0 z-10 overflow-y-auto" class:hidden={!open}>
    <div
      class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
    >
      <!--
        Modal panel, show/hide based on modal state.

        Entering: "ease-out duration-300"
          From: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          To: "opacity-100 translate-y-0 sm:scale-100"
        Leaving: "ease-in duration-200"
          From: "opacity-100 translate-y-0 sm:scale-100"
          To: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
      -->
      <!-- {#if !submitting} -->
      <div
        class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
        class:hidden={!open}
        use:clickOutside
      >
        <div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
              Resource or service request
            </h3>

            <div class="mt-4 text-left">
              <div>
                <label
                  for="receiver"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Receiver</label
                >
                <select
                  id="receiver"
                  name="receiver"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  bind:value={currentIntent.receiver}
                >
                {#if agents}
                {#each agents as agent}
                  <option selected value={agent.id}>{agent.name}</option>
                {/each}
                {/if}
                  <!-- <option selected>Lazy Acre Alpacca</option>
                  <option>Woodland meadow farm</option> -->
                </select>
              </div>
            </div>

            {#if resourceSpecifications}
            <div class="mt-4 text-left">
              <div>
                <label
                  for="defaultUnitOfResource"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >What is requested from the network</label
                >
                <select
                  id="defaultUnitOfResource"
                  name="defaultUnitOfResource"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  bind:value={currentIntent.resourceConformsTo}
                  on:change={(e) => {
                    let id = e.target.value
                    let selectedResource = resourceSpecifications.find((rs) => rs.id === id)
                    if (currentIntent.availableQuantity) {
                      currentIntent.availableQuantity.hasUnit = selectedResource.defaultUnitOfResource.id
                    } else {
                      console.log("no availablequantity")
                    }
                    console.log(currentIntent.availableQuantity)
                  }}
                >
                {#each resourceSpecifications as rs}
                  <option value={rs.id}>{rs.name}</option>
                {/each}
                <!-- <option selected>Brown alpacca dirty</option>
                  <option>White alpacca dirty</option>
                  <option>White wool greasy</option> -->
                </select>
              </div>
            </div>
            {/if}

            <div class="mt-4 text-left flex justify-between">

              <div class="text-left">
                <label
                  for="name"
                  class="block text-sm font-medium leading-6 text-gray-900">Quantity</label
                >
                <div class="relative mt-2 rounded-md shadow-sm">
                  {#if currentIntent.resourceQuantity}
                  <input
                    type="text"
                    name="name"
                    id="name"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder=""
                    bind:value={currentIntent.resourceQuantity.hasNumericalValue}
                    on:change={(e) => {
                      console.log(e.target.value)
                    }}
                    required
                    aria-invalid="true"
                    aria-describedby="name-error"
                  />
                  {/if}
                  <!-- <div
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    <svg
                      class="h-5 w-5 text-red-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div> -->
                </div>
                <!-- <p class="mt-2 text-sm text-red-600" id="email-error">
                  Quantity is required.
                </p> -->
              </div>

              <div>
                <label
                  for="unit"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Unit</label
                >
                {#if currentIntent.availableQuantity}
                <select
                  id="unit"
                  name="unit"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  bind:value={currentIntent.availableQuantity.hasUnit}
                >
                {#if units}
                {#each units as unit}
                  {#if unit.label === "pound"}
                    <option selected value={unit.id}>Pound</option>
                  {:else if unit.label === "one"}
                    <option value={unit.id}>Each</option>
                  {/if}
                {/each}
                {/if}
                  <!-- <option selected>lb</option> -->
                </select>
                {/if}
              </div>
            </div>

            <div class="mt-4 text-left">
              <div class="col-span-full">
                <label
                  for="note"
                  class="block text-sm font-medium leading-6 text-gray-900">Description</label
                >
                <div class="mt-2">
                  <textarea
                    id="note"
                    name="note"
                    rows="3"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    bind:value={currentIntent.note}
                  />
                </div>
                <!-- <p class="mt-3 text-sm leading-6 text-gray-600">
                  Description for the description field
                </p> -->
              </div>
            </div>

          </div>
        </div>
        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
            disabled={!isOfferValid}
            on:click={() => {
              if (editing) {
                handleUpdate()
              } else {
                handleSubmit()
              }
            }}            >
            {#if editing}
            Update
            {:else}
            Create
            {/if}
            </button
          >
          <button
            type="button"
            on:click={() => (open = false)}
            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
            >Cancel</button
          >
        </div>
      </div>
      <!-- {:else}
        <div
          class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          class:hidden={!submitting}
        >
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <svg width="50" height="50" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="rgb(99,102,241)" stroke-dasharray="31.415, 31.415" />
              </svg>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3
                  class="text-lg leading-6 font-medium text-gray-900"
                  id="modal-headline"
                >
                  Saving request ...
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    Please wait while the request saves.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if} -->
    </div>
  </div>
</div>
