<script lang="ts">
  import { DateInput } from 'date-picker-svelte'
  import { clickOutside } from '../../utils'
  import { onMount } from 'svelte'
  import { mutation, query } from 'svelte-apollo'
  import { createEventDispatcher } from 'svelte';
  import type { Agent, ProposalCreateParams, Intent, IntentCreateParams, IntentUpdateParams, ResourceSpecification, IMeasure } from '@leosprograms/vf-graphql'
  import { createProposal, updateProposal, createIntent, updateIntent, createProposedIntent } from '../../crud/commit'
  import { addHashChange } from '../../crud/commit'

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

  let currency: string;
  $: currencyFull = resourceSpecifications?.find((rs) => rs.name === "USD")
  $: currency = currencyFull?.id

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

  const dispatch = createEventDispatcher();

  // helper to workaround direct bind:value syntax coercing things to strings
  function parseFormValues(val: IMeasure) {
    if (val.hasNumericalValue || val.hasNumericalValue === "0") val.hasNumericalValue = parseFloat(val.hasNumericalValue)
    return val
  }

  export async function handleSubmit(currentIntent: IntentUpdateParams, currentReciprocalIntent: IntentUpdateParams, hashMap = false) {
    submitting = true;
    if (currency) {
      currentReciprocalIntent.resourceConformsTo = currency
    }
    console.log("CURENCY", currency, currentReciprocalIntent)
    try {
      // create proposal
      var d = new Date(Date.now());
      let proposal: ProposalCreateParams = {
        hasBeginning: d,
        unitBased: true,
        note: "shearing end of May"
      }
      const res1 = await createProposal(proposal);
      const res1ID: string = String(res1.id)//.data.createProposal.proposal.id)

      // create intent
      const intent: IntentCreateParams = {
        action: currentIntent.action as string,
        resourceConformsTo: currentIntent.resourceConformsTo || undefined,
        resourceInventoriedAs: currentIntent.resourceInventoriedAs || undefined,
        inScopeOf: currentIntent.inScopeOf || undefined,
        inputOf: currentIntent.inputOf || undefined,
        outputOf: currentIntent.outputOf || undefined,
        provider: currentIntent.provider || undefined,
        receiver: currentIntent.receiver || undefined,
        note: currentIntent.note || undefined,
        resourceQuantity: currentIntent.resourceQuantity ? parseFormValues(currentIntent.resourceQuantity as IMeasure) : undefined,
        availableQuantity: currentIntent.availableQuantity ? parseFormValues(currentIntent.availableQuantity as IMeasure) : undefined,
        effortQuantity: currentIntent.effortQuantity ? parseFormValues(currentIntent.effortQuantity as IMeasure) : undefined,
      }
      if (intent.resourceQuantity) {
        intent.resourceQuantity.hasUnit = currentIntent.availableQuantity?.hasUnit
      }
      const res2 = await createIntent(intent)
      const res2ID = res2.id//.data.createIntent.intent.id
      console.log(res2);

      if (hashMap) {
        addHashChange(currentIntent.id, res2ID)
      }

      // create reciprocal intent
      const recipIntent = {
        receiver: currentIntent.provider,
        action: "transfer",
        resourceConformsTo: currentReciprocalIntent.resourceConformsTo,
        resourceQuantity: currentReciprocalIntent.resourceQuantity ? {
          ...parseFormValues(currentReciprocalIntent.resourceQuantity as IMeasure),
          hasUnit: currencyFull?.defaultUnitOfResource?.id//resourceSpecifications.find((rs) => rs.id === currentReciprocalIntent.resourceConformsTo)?.defaultUnitOfResource?.id
        } : undefined,
      }
      console.log("((((", recipIntent, currentReciprocalIntent)
      const res3 = await createIntent(recipIntent)
      console.log(res3)
      const res3ID: string = String(res3.id)//.data.createIntent.intent.id)

      if (hashMap) {
        addHashChange(recipIntent.id, res3ID)
      }

      let reciprocal: boolean = false
      let publishedIn = res1ID
      let publishes = res2ID

      const res4 = await createProposedIntent(reciprocal, publishedIn, publishes)

      reciprocal = true
      publishes = res3ID

      const res5 = await createProposedIntent(reciprocal, publishedIn, publishes)


      dispatch("submit");
      submitting = false;
      open = false;
    } catch (error) {
      console.error(error)
    }
  }

  async function handleUpdate() {
    submitting = true;
    currentReciprocalIntent.resourceConformsTo = currency
    // console.log(currentProposal)
    let proposal = currentProposal
    const updatedProposal = await updateProposal(proposal)
    // let intent = currentIntent
    let intent = {
      id: currentIntent.id,
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
    const res = await updateIntent(intent)
    console.log(res)

    let intent2 = {
      id: currentReciprocalIntent.id,
      receiver: currentIntent.provider,
      revisionId: currentReciprocalIntent.revisionId,
      action: currentReciprocalIntent.action as string,
      resourceConformsTo: currentReciprocalIntent.resourceConformsTo,
      availableQuantity: currentReciprocalIntent.availableQuantity ? parseFormValues(currentReciprocalIntent.availableQuantity as IMeasure) : undefined,
      effortQuantity: currentReciprocalIntent.effortQuantity ? parseFormValues(currentReciprocalIntent.effortQuantity as IMeasure) : undefined,
      // resourceQuantity: currentReciprocalIntent.resourceQuantity ? parseFormValues(currentReciprocalIntent.resourceQuantity as IMeasure) : undefined,
      resourceQuantity: currentReciprocalIntent.resourceQuantity ? {
        ...parseFormValues(currentReciprocalIntent.resourceQuantity as IMeasure),
        hasUnit: currencyFull?.defaultUnitOfResource
      } : undefined,
    }
    const res2 = await updateIntent(intent2)
    dispatch("submit");
    console.log(res2)
    submitting = false;
    open = false;
  }


  // onMount(() => {
  // })

  $: currentProposal, currentIntent, currentReciprocalIntent, currentProposedIntent, submitting, currency
  $: isOfferValid = !submitting && currentProposal.hasBeginning && currentIntent && currentIntent.provider && currentIntent.resourceConformsTo && currentIntent.resourceQuantity?.hasNumericalValue && currency && currentIntent.availableQuantity?.hasUnit && currency
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
                  for="provider"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Provider</label
                >
                <select
                  id="provider"
                  name="provider"
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
                    if (currentIntent.availableQuantity) {
                      currentIntent.availableQuantity.hasUnit = selectedResource.defaultUnitOfResource.id
                    } else {
                      console.log(currentIntent.availableQuantity)
                    }
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
                  class="block text-sm font-medium leading-6 text-gray-900">Available quantity</label
                >
                <div class="relative mt-2 rounded-md shadow-sm">
                  <!-- for required:  class="block w-full rounded-md border-0 py-1.5 pr-10 text-red-900 ring-1 ring-inset ring-red-300 placeholder:text-red-300 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"-->
                  {#if currentIntent.availableQuantity}
                  <input
                    type="number"
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
                {#if currentIntent.availableQuantity}
                <select
                  id="unit"
                  name="unit"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  bind:value={currentIntent.availableQuantity.hasUnit}
                  >
                {#if units}
                {#each units as unit}
                  <option value={unit.id}>{unit.label}</option>
                  <!-- {#if unit.label === "pound"}
                    <option selected value={unit.id}>Pound</option>
                  {:else if unit.label === "one"}
                    <option value={unit.id}>Each</option>
                  {/if} -->
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
                  >Price</label>
                <div class="relative mt-2 rounded-md shadow-sm">
                  {#if currentReciprocalIntent && currentReciprocalIntent.resourceQuantity}
                  <input
                    type="number"
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
                {#if currentReciprocalIntent}
                <!-- {JSON.stringify(resourceSpecifications)} -->
                <!-- <select>
                  {#each resourceSpecifications as r}
                  {#if r.name == "USD"}
                  {r.name}
                  <option selected value={r.id}>USD</option>
                  {/if}
                  {/each}
                </select> -->
                <select
                  id="unit"
                  name="unit"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  bind:value={currency}
                  >

                  {#if resourceSpecifications}
                  {#each resourceSpecifications as r}
                    {#if r.name == "USD"}
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
                  {#if currentIntent.resourceQuantity}
                  <input
                    type="number"
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
                {#if currentIntent.resourceQuantity}
                <select
                  id="unit"
                  name="unit"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  bind:value={currentIntent.resourceQuantity.hasUnit}
                >
                {#if units}
                {#each units as unit}
                  <option value={unit.id}>{unit.label}</option>
                  <!-- {#if unit.label === "pound"}
                    <option selected value={unit.id}>Pound</option>
                  {:else if unit.label === "one"}
                    <option value={unit.id}>Each</option>
                  {/if} -->
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
                handleSubmit(currentIntent, currentReciprocalIntent)
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
