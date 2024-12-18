<script lang="ts">
  import { clickOutside } from '../utils'
  import { allActions, allResourceSpecifications, allUnits } from '../crud/store';
  import { createRecipeFlow, updateRecipeFlow } from '../crud/commit';
  import { onMount } from 'svelte';
  import type { RecipeFlowCreateParams, RecipeFlowUpdateParams } from '@leosprograms/vf-graphql'
  import { getAllRecipes } from '../crud/fetch';
  import { json } from '@sveltejs/kit'
  import { get } from 'svelte/store'
  import { RecipeFlow } from '@leosprograms/vf-graphql';
  import { createEventDispatcher } from 'svelte';

  // public CustomElement attributes
  export let processSpecifications;
  export let open = false
  export let recipeFlow: RecipeFlowCreateParams | RecipeFlowUpdateParams;

  let units: any[] = []
  allUnits.subscribe(value => {
    units = value
  })

  let actions: any[] = []
  allActions.subscribe(value => {
    actions = value
  })

  let resourceSpecifications: any[] = []
  allResourceSpecifications.subscribe(value => {
    resourceSpecifications = value
  })

  const dispatch = createEventDispatcher();

  let roles = [
    "Farmer",
    "Scouring Mill",
    "Spinning Mill",
    "Knitting Factory",
    "Weaving Factory",
    "Designer",
    "Shipping",
    "Network",
  ]

  function checkKey(e: any) {
    if (e.key === "Escape" && !e.shiftKey) {
      e.preventDefault();
      open = false;
    }
  }

  $: validToSave = recipeFlow.resourceQuantity && Number(recipeFlow.resourceQuantity.hasNumericalValue) > 0 && recipeFlow.resourceQuantity.hasUnit != '' && recipeFlow.stage != '' && recipeFlow.resourceConformsTo != '' && recipeFlow.action != '';

  onMount(async () => {
    window.addEventListener("keydown", checkKey);
  })
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
  <div
    class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
    class:hidden={!open}
  />

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
              Recipe Flow
            </h3>

            <div class="mt-4 text-left">
              <div>
                <label
                  for="provider"
                  class="block text-sm font-medium leading-6 text-gray-900">Action</label
                >
                <select
                  id="provider"
                  name="provider"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={recipeFlow.action}
                  on:change={(e) => {
                    recipeFlow.action = e.target.value
                  }}
                >
                  <option value={''}></option>
                  {#each actions as action}
                    <option value={action.id}>{action.label}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="mt-4 text-left">
              <div>
                <label
                  for="provider_role"
                  class="block text-sm font-medium leading-6 text-gray-900">Provider Role</label
                >
                <select
                  id="provider_role"
                  name="provider_role"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={recipeFlow.providerRole}
                  on:change={(e) => {
                    recipeFlow.providerRole = e.target.value
                  }}
                >
                  <option value={''}></option>
                  {#each roles as role}
                    <option value={role}>{role}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="mt-4 text-left">
              <div>
                <label
                  for="receiverRole"
                  class="block text-sm font-medium leading-6 text-gray-900">Receiver Role</label
                >
                <select
                  id="receiverRole"
                  name="receiverRole"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={recipeFlow.receiverRole}
                  on:change={(e) => {
                    recipeFlow.receiverRole = e.target.value
                  }}
                >
                  <option value={''}></option>
                  {#each roles as role}
                    <option value={role}>{role}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="mt-4 text-left">
              <div>
                <label
                  for="provider"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Resource specification</label
                >
                <select
                  id="provider"
                  name="provider"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={recipeFlow.resourceConformsTo}
                  on:change={(e) => {
                    recipeFlow.resourceConformsTo = e.target.value
                    if (recipeFlow.resourceQuantity?.hasUnit != null) {
                      let unitId = resourceSpecifications.find(it => it.id === e.target.value)?.defaultUnitOfResource?.id
                      recipeFlow.resourceQuantity.hasUnit = unitId ? unitId : ''
                    }
                  }}
                >
                  <option value={''}></option>
                  {#each resourceSpecifications as resourceSpecification}
                    <option value={resourceSpecification.id}>{resourceSpecification.name}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="mt-4 text-left flex justify-between">
              <div class="text-left">
                <label
                  for="name"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Quantity</label
                >
                <div class="relative mt-2 rounded-md shadow-sm">
                  <!-- <input
                    type="text"
                    name="name"
                    id="name"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder=""
                    required
                    aria-invalid="true"
                    aria-describedby="name-error"
                  /> -->
                  <input
                      type="number"
                      name="quantity"
                      id="quantity"
                      class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      placeholder=""
                      value={recipeFlow.resourceQuantity?.hasNumericalValue}
                      on:change={(e) => {
                        recipeFlow.resourceQuantity = {
                          hasNumericalValue: Number(e.target.value),
                          hasUnit: recipeFlow.resourceQuantity?.hasUnit
                        }
                        console.log(recipeFlow)
                      }}
                      min=0
                      required
                      aria-invalid="true"
                      aria-describedby="name-error"
                    />
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
                  class="block text-sm font-medium leading-6 text-gray-900">Unit</label
                >
                {recipeFlow.resourceQuantity?.hasUnit ? units.find(it => it.id === recipeFlow.resourceQuantity.hasUnit).label
                 : ""}
                <!-- <select
                  id="unit"
                  name="unit"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  on:change={(e) => {
                    recipeFlow.unit = e.target.value
                  }}
                >
                  {#each $allUnits as unit}
                    <option value={unit.id}>{unit.label}</option>
                  {/each}
                </select> -->
              </div>
            </div>

            <div class="mt-4 text-left">
              <div>
                <label
                  for="provider"
                  class="block text-sm font-medium leading-6 text-gray-900">Stage</label
                >
                <select
                  id="provider"
                  name="provider"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={recipeFlow.stage}
                  on:change={(e) => {
                    recipeFlow.stage = e.target.value
                  }}
                >
                  <option value={''}></option>
                  {#each processSpecifications as processSpecification}
                    <option value={processSpecification.id}>{processSpecification.name}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="mt-4 text-left">
              <div class="col-span-full">
                <label
                  for="note"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Description</label
                >
                <div class="mt-2">
                  <textarea
                    id="note"
                    name="note"
                    rows="3"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    bind:value={recipeFlow.note}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
            disabled={!validToSave}
            on:click={async () => {
              console.log(recipeFlow)
              if (recipeFlow.revisionId) {
                await updateRecipeFlow(recipeFlow)
              } else {
                console.log(recipeFlow)
                await createRecipeFlow(recipeFlow)
              }
              open = false
              dispatch('save')
            }}
          >
            {recipeFlow.revisionId ? 'Update' : 'Create'}
          </button>
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
