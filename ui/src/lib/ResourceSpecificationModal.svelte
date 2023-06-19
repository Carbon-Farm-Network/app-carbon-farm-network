<script lang="ts">
  import { gql } from 'graphql-tag'
  import type { RecordMeta, ResourceSpecification, ResourceSpecificationCreateParams, ResourceSpecificationUpdateParams } from '@valueflows/vf-graphql'
  import { createEventDispatcher } from 'svelte';
  import { RESOURCE_SPECIFICATION_CORE_FIELDS } from './graphql/resource_specification.fragments'
  import { mutation, query } from 'svelte-apollo'
  import { onMount } from 'svelte'
  const dispatch = createEventDispatcher();
  
  export let open = false;
  export let editing = false;
  export let currentResourceSpecification: any = {};
  export let name = "";
  export let units: any[];
  
  const facets = [
     {
      "id": "color",
      "name": "Color",
      "description": "A very detailed description",
      "order": 1,
    }
  ]
  const facetValues =  [{
    "id": "white",
    "value": "White",
    "order": 1,
    "description": "like snow"
  },{
    "id": "brown",
    "value": "Brown",
    "order": 2,
    "description": "like chocolate"
  },{
    "id": "gray",
    "value": "Gray",
    "order": 3,
    "description": "like smoke"
  }]

  const ADD_RESOURCE_SPECIFICATION = gql`
    ${RESOURCE_SPECIFICATION_CORE_FIELDS},
    mutation($resource: ResourceSpecificationCreateParams!){
      createResourceSpecification(resourceSpecification: $resource) {
        resourceSpecification {
          ...ResourceSpecificationCoreFields
        }
      }
    }
  `
  const UPDATE_RESOURCE_SPECIFICATION = gql`
    ${RESOURCE_SPECIFICATION_CORE_FIELDS},
    mutation($resource: ResourceSpecificationUpdateParams!){
      updateResourceSpecification(resourceSpecification: $resource) {
        resourceSpecification {
          ...ResourceSpecificationCoreFields
        }
      }
    }
  `

  let addResourceSpecification: any = mutation(ADD_RESOURCE_SPECIFICATION)
  let updateResourceSpecification: any = mutation(UPDATE_RESOURCE_SPECIFICATION)
  // let retrieveUnits: any = query(GET_UNITS_OF_EFFORT_AND_RESOURCE)

  async function handleSubmit() {
    // let unitOfResource = units.find(unit => unit.id === currentResourceSpecification.defaultUnitOfResource).id
    // let unitId = {
    //   UnitId: currentResourceSpecification.defaultUnitOfResource
    // }
    let resource: ResourceSpecificationCreateParams = {
      name: currentResourceSpecification.name,
      defaultUnitOfResource: currentResourceSpecification.defaultUnitOfResourceId,
      // defaultUnitOfEffort: "Administrative work",
      note: currentResourceSpecification.note,
      image: currentResourceSpecification.image,
    }
    console.log(resource)
    try {
      const res = await addResourceSpecification({ variables: { resource } })
      dispatch("submit");
      open = false;
      console.log(res)
    } catch (error) {
      console.error(error)
    }
  }

  async function handleUpdate() {
    // getAgent();
    console.log(currentResourceSpecification)

    let resource: ResourceSpecificationUpdateParams = {
      name: currentResourceSpecification.name,
      defaultUnitOfResource: currentResourceSpecification.defaultUnitOfResourceId,
      // defaultUnitOfEffort: currentResourceSpecification.defaultUnitOfEffort,
      note: currentResourceSpecification.note,
      image: currentResourceSpecification.image,
      revisionId: currentResourceSpecification.revisionId
    }
    try {
      const res = await updateResourceSpecification({ variables: { resource } })
      dispatch("submit");
      open = false;
      console.log(res)
    } catch (error) {
      console.error(error)
    }
  }


  onMount(async () => {
  })

  $: editing, currentResourceSpecification, units; //, client;

  $: isResourceSpecificationValid = true && currentResourceSpecification.name && currentResourceSpecification.defaultUnitOfResourceId && currentResourceSpecification.note && currentResourceSpecification.image;

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
      >
        <div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
              Add a resource specification
            </h3>

            <div class="mt-4">
              <div class="text-left">
                <label
                  for="name"
                  class="block text-sm font-medium leading-6 text-gray-900">Name</label
                >
                <div class="relative mt-2 rounded-md shadow-sm">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder=""
                    bind:value={currentResourceSpecification.name}
                    on:input={e => {
                      const input = e.target;
                      if (input instanceof HTMLInputElement) {
                        currentResourceSpecification.name = input.value;
                        // console.log(name)
                      }
                    }}
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
                  Name is required.
                </p> -->
              </div>
            </div>
            
            {#if units}
            <div class="mt-4 text-left">
              <div>
                <label
                  for="defaultUnitOfResource"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Default unit of resource</label>

                <select
                  id="classifiedAs"
                  name="classifiedAs"
                  bind:value={currentResourceSpecification.defaultUnitOfResourceId}
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  on:click={e => {
                    console.log(currentResourceSpecification.defaultUnitOfResourceId)
                  }}
                  >
                  {#each units as unit}
                    {#if unit.label === "pound"}
                      <option selected value={unit.id}>Pound</option>
                    {:else if unit.label === "one"}
                      <option value={unit.id}>Each</option>
                    {/if}
                  {/each}
                </select>

                <!-- <select
                  id="defaultUnitOfResource"
                  name="defaultUnitOfResource"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                  <option selected>Pound</option>
                  <option>Each</option>
                </select> -->
              </div>
            </div>
            {/if}

            <!-- <div class="mt-4 text-left">
              <div>
                <label
                  for="defaultUnitOfEffort"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Default unit of effort</label
                >
                <select
                  id="defaultUnitOfEffort"
                  name="defaultUnitOfEffort"
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                  <option selected>Administrative work</option>
                  <option>Delivery work</option>
                </select>
              </div>
            </div> -->

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
                    bind:value={currentResourceSpecification.note}
                    on:input={e => {
                      const input = e.target;
                      if (input instanceof HTMLInputElement) {
                        currentResourceSpecification.note = input.value;
                      }
                    }}
                    />
                </div>
                <p class="mt-3 text-sm leading-6 text-gray-600">
                  Description for the description field
                </p>
              </div>
            </div>

            <div class="mt-4 text-left">
              <div class="col-span-full">
                <label
                  for="image"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Logo url</label
                >
                <div class="mt-2">
                  <input
                    type="text"
                    name="longitude"
                    id="longitude"
                    autocomplete="longitude"
                    placeholder="https://www.example.com/logo.png"
                    bind:value={currentResourceSpecification.image}
                    on:input={e => {
                      const input = e.target;
                      if (input instanceof HTMLInputElement) {
                        currentResourceSpecification.image = input.value;
                      }
                    }}
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>


            <!-- <div class="mt-4 text-left">
              <div class="col-span-full">
                <label
                  for="image"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Default image</label
                >
                <div
                  class="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10"
                >
                  <div class="text-center">
                    <svg
                      class="mx-auto h-12 w-12 text-gray-300"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <div class="mt-4 flex text-sm leading-6 text-gray-600">
                      <label
                        for="file-upload"
                        class="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          class="sr-only"
                        />
                      </label>
                      <p class="pl-1">or drag and drop</p>
                    </div>
                    <p class="text-xs leading-5 text-gray-600">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            </div> -->
          <!-- </div>
        </div> -->

        {#each facets as {name}}

          <div class="mt-4 text-left">
            <div>
              <label
                for="type"
                class="block text-sm font-medium leading-6 text-gray-900"
                >{name}</label
              >
              <select
                id="type"
                name="type"
                class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                {#each facetValues as {value}}
                  <option>{value}</option>
                {/each}
              </select>
            </div>
          </div>
        {/each}

        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            disabled={!isResourceSpecificationValid}
            on:click={() => {
              if (editing) {
                handleUpdate()
              } else {
                handleSubmit()
              }
            }}
            class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
            >
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

<style>
  button:disabled { background-color: lightgray; }
</style>