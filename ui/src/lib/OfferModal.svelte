<script lang="ts">
  import { DateInput } from 'date-picker-svelte'
  import { PROPOSAL_CORE_FIELDS, INTENT_CORE_FIELDS, PROPOSED_INTENT_CORE_FIELDS } from '$lib/graphql/proposal.fragments'
  import { RESOURCE_SPECIFICATION_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'
  import type { RelayConn } from '$lib/graphql/helpers'
  import { gql } from 'graphql-tag'
  import type { ReadableQuery } from 'svelte-apollo'
  import { clickOutside } from './utils'
  import { onMount } from 'svelte'
  import { mutation, query } from 'svelte-apollo'
  import { createEventDispatcher } from 'svelte';
  import type { AgentConnection, Agent, ProposalCreateParams, IntentCreateParams, UnitConnection, MutationProposeIntentArgs, Scalars, Intent, IntentUpdateParams } from '@valueflows/vf-graphql'
  import { flattenRelayConnection } from '$lib/graphql/helpers'
  import { browser } from '$app/environment'

  // public CustomElement attributes
  export let open = false;
  export let name = "";
  export let resourceSpecifications: any[];
  export let units: any[];
  export let agents: any[];
  export let date = new Date();
  export let currentProposal: any;
  export let currentIntent: Intent | null;
  export let currentReciprocalIntent: IntentCreateParams;
  export let currentProposedIntent: any;
  export let editing: boolean;

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

  async function handleSubmit() {
    console.log(currentProposal)
    console.log(currentIntent)
    console.log(currentReciprocalIntent)
    console.log(currentProposedIntent)
    try {
      // create proposal
      var d = new Date(Date.now());
      let proposal: ProposalCreateParams = {
        hasBeginning: d,
        unitBased: true,
        note: "shearing end of May"
      }
      const res1 = await addProposal({ variables: { proposal } })
      const res1ID: String = String(res1.data.createProposal.proposal.id)

      // create intent
      let intent: IntentCreateParams = {
        provider: currentIntent.provider?.id,
        action: "transfer",
        resourceConformsTo: currentIntent.resourceConformsTo?.id,
        availableQuantity: {
          hasNumericalValue: parseFloat(currentIntent.availableQuantity?.hasNumericalValue),
          hasUnit: currentIntent.availableQuantity?.hasUnit?.id,
        },
        resourceQuantity: {
          hasNumericalValue: parseFloat(currentIntent.resourceQuantity?.hasNumericalValue),
          // available quantity and resource quantity should have the same unit
          hasUnit: currentIntent.availableQuantity?.hasUnit?.id,
        },
        note: currentIntent.note
      }
      const res2 = await addIntent({ variables: { intent } });
      const res2ID = res2.data.createIntent.intent.id
      console.log(res2);

      // create reciprocal intent
      let each = units.find(u => u.label === "one")
      intent = {
        provider: currentIntent.provider?.id,
        action: "transfer",
        resourceConformsTo: currentReciprocalIntent.resourceConformsTo,
        resourceQuantity: {
          hasNumericalValue: parseFloat(currentReciprocalIntent.resourceQuantity?.hasNumericalValue),
          hasUnit: each.id,
        }
      }
      const res3 = await addIntent({ variables: { intent } })
      const res3ID: String = String(res3.data.createIntent.intent.id)


      let reciprocal: Boolean = false
      let publishedIn = res1ID
      let publishes = res2ID

      const res4 = await addProposedIntent({ variables: { reciprocal, publishedIn, publishes } })
      console.log(res4)

      reciprocal = true
      publishedIn = res1ID
      publishes = res3ID

      const res5 = await addProposedIntent({ variables: { reciprocal, publishedIn, publishes } })
      console.log(res4)


      dispatch("submit");
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
    // console.log(currentProposal)
    let proposal = currentProposal
    updateProposal({ variables: { proposal: proposal } })
    // let intent = currentIntent
    let intent = {
      revisionId: currentIntent.revisionId
    }
    console.log(intent)
    updateIntent({ variables: { intent: intent } })
  }


  onMount(() => {
    // let x = cri1()
    // console.log(x)
    if (browser) {
      console.log('hello')
    }
    // handleSubmit()
  })

  $: currentProposal, currentIntent, currentReciprocalIntent, currentProposedIntent
  $: isOfferValid = true && currentProposal.hasBeginning && currentIntent.provider && currentIntent.resourceConformsTo && currentIntent.note;
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
      <div
        class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
        class:hidden={!open}
        use:clickOutside
      >
        <div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
              Resource or service offer
            </h3>

            <div class="mt-4 text-left">
              <div>
                <label
                  for="defaultUnitOfResource"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Provider</label
                >
                <select
                  id="defaultUnitOfResource"
                  name="defaultUnitOfResource"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  bind:value={currentIntent.provider}
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
                  >What is offered to the network</label
                >
                <select
                  id="defaultUnitOfResource"
                  name="defaultUnitOfResource"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  bind:value={currentIntent.resourceConformsTo}
                  on:change={(e) => {
                    let id = e.target.value
                    let selectedResource = resourceSpecifications.find((rs) => rs.id === id)
                    console.log(selectedResource)
                    console.log("hi")
                    if (currentIntent.availableQuantity && currentIntent.availableQuantity.hasUnit) {currentIntent.availableQuantity.hasUnit.id = selectedResource.defaultUnitOfResource.id}
                    // currentIntent.availableQuantity.hasUnit = d.target.value
                    // if (currentIntent.availableQuantity) {
                    //   currentIntent.availableQuantity.hasUnit = d.target.value.defaultUnitOfResource.id
                    // }
                  }}
                >
                {#each resourceSpecifications as rs}
                  <option value={rs.id}>{rs.name}</option>
                {/each}
                <!-- <option selected>Brown alpacca dirty</option>
                  <option>White alpacca dirty</option>
                  <option>White wool dirty</option> -->
                </select>
              </div>
            </div>
            {/if}

            <div class="mt-4 text-left flex justify-between">

              <div class="text-left">
                <label
                  for="name"
                  class="block text-sm font-medium leading-6 text-gray-900">Available quantity</label
                >
                <div class="relative mt-2 rounded-md shadow-sm">
                  <!-- for required:  class="block w-full rounded-md border-0 py-1.5 pr-10 text-red-900 ring-1 ring-inset ring-red-300 placeholder:text-red-300 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"-->
                  {#if currentIntent && currentIntent.availableQuantity}
                  <input
                    type="text"
                    name="name"
                    id="name"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder=""
                    bind:value={currentIntent.availableQuantity.hasNumericalValue}
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
                {#if currentIntent && currentIntent.availableQuantity && currentIntent.availableQuantity.hasUnit}
                <select
                  id="unit"
                  name="unit"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  bind:value={currentIntent.availableQuantity.hasUnit.id}
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

            <div class="mt-4 text-left flex justify-between">

              <div class="text-left">
                <label
                  for="name"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Price</label
                  >
                <div class="relative mt-2 rounded-md shadow-sm">
                  {#if currentReciprocalIntent && currentReciprocalIntent.resourceQuantity}
                  <input
                    type="text"
                    name="name"
                    id="name"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder=""
                    bind:value={currentReciprocalIntent.resourceQuantity.hasNumericalValue}
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
                  Price is required.
                </p> -->
              </div>

              <div>
                <label
                  for="unit"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Currency</label
                >
                <!-- USD -->
                <!-- {JSON.stringify(currentReciprocalIntent.resourceConformsTo != "undefined")} -->
                {#if currentReciprocalIntent && currentReciprocalIntent.resourceConformsTo}
                <select
                  id="unit"
                  name="unit"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  bind:value={currentReciprocalIntent.resourceConformsTo}
                  >

                  {#if resourceSpecifications}
                  {#each resourceSpecifications as r}
                    {JSON.stringify(r)}
                    {#if r.name === "USD"}
                      <option selected value={r.id}>USD</option>
                    {/if}
                  {/each}
                  {/if}
                </select>
                {/if}
              </div>
            </div>

            <div>
              <p>PER</p>
            </div>

            <div class="mt-4 text-left flex justify-between">

              <div class="text-left">
                <label
                  for="name"
                  class="block text-sm font-medium leading-6 text-gray-900">Quantity</label
                >
                <div class="relative mt-2 rounded-md shadow-sm">
                  {#if currentIntent && currentIntent.resourceQuantity}
                  <input
                    type="text"
                    name="name"
                    id="name"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder=""
                    bind:value={currentIntent.resourceQuantity.hasNumericalValue}
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
                {#if currentIntent && currentIntent.availableQuantity}
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
              <label
                for="date"
                class="block text-sm font-medium leading-6 text-gray-900"
                >Date available</label
              >
              <DateInput bind:value={currentProposal.hasBeginning} />
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
                <p class="mt-3 text-sm leading-6 text-gray-600">
                  Description for the description field
                </p>
              </div>
            </div>

          </div>
        </div>
        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
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
    </div>
  </div>
</div>
