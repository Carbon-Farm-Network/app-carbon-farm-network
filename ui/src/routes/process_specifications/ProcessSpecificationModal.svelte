<script lang="ts">
  import { gql } from 'graphql-tag'
  import type { RecordMeta, ProcessSpecification, ProcessSpecificationCreateParams, ProcessSpecificationUpdateParams } from '@leosprograms/vf-graphql'
  import { createEventDispatcher } from 'svelte';
  import { PROCESS_SPECIFICATION_CORE_FIELDS } from '../../lib/graphql/process_specification.fragments'
  import { mutation, query } from 'svelte-apollo'
  import type { Facet } from "$lib/graphql/extension-schemas"
  import { onMount } from 'svelte'
  import { createProcessSpecification, updateProcessSpecification } from '../../crud/commit';
  const dispatch = createEventDispatcher();
  
  export let open = false;
  export let editing = false;
  export let currentProcessSpecification: any = {};
  export let name = "";

  function checkKey(e: any) {
    if (e.key === "Escape" && !e.shiftKey) {
      e.preventDefault();
      open = false;
    }
  }

  onMount(() => {
    window.addEventListener("keydown", checkKey);
  });

  export async function handleSubmit(currentProcessSpecification: ProcessSpecificationCreateParams) {
    let process: ProcessSpecificationCreateParams = {
      name: currentProcessSpecification.name,
      note: currentProcessSpecification.note,
      image: currentProcessSpecification.image,
    }
    console.log(process)
    try {
      const res = await createProcessSpecification(process)
      dispatch("submit");
      open = false;
      console.log(res)
      return res
    } catch (error) {
      console.error(error)
    }
  }

  async function handleUpdate() {
    let process: ProcessSpecificationUpdateParams = {
      name: currentProcessSpecification.name,
      note: currentProcessSpecification.note,
      image: currentProcessSpecification.image,
      revisionId: currentProcessSpecification.revisionId
    }
    try {
      const res = await updateProcessSpecification(process)
      dispatch("submit");
      open = false;
      console.log(res)
    } catch (error) {
      console.error(error)
    }
  }


  onMount(async () => {
  })

  $: editing, currentProcessSpecification, open; //, client;

  $: isResourceSpecificationValid = true && currentProcessSpecification.name;

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
              Process Specification
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
                    bind:value={currentProcessSpecification.name}
                    on:input={e => {
                      const input = e.target;
                      if (input instanceof HTMLInputElement) {
                        currentProcessSpecification.name = input.value;
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
                    bind:value={currentProcessSpecification.note}
                    on:input={e => {
                      const input = e.target;
                      if (input instanceof HTMLInputElement) {
                        currentProcessSpecification.note = input.value;
                      }
                    }}
                    />
                </div>
                <!-- <p class="mt-3 text-sm leading-6 text-gray-600">
                  Description for the description field
                </p> -->
              </div>
            </div>

            <div class="mt-4 text-left">
              <div class="col-span-full">
                <label
                  for="image"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Image url</label
                >
                <div class="mt-2">
                  <input
                    type="text"
                    name="image"
                    id="image"
                    autocomplete="longitude"
                    placeholder="https://www.example.com/logo.png"
                    bind:value={currentProcessSpecification.image}
                    on:input={e => {
                      const input = e.target;
                      if (input instanceof HTMLInputElement) {
                        currentProcessSpecification.image = input.value;
                        console.log(currentProcessSpecification.image)
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

        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            disabled={!isResourceSpecificationValid}
            on:click={() => {
              if (editing) {
                handleUpdate()
              } else {
                handleSubmit(currentProcessSpecification)
              }
            }}
            class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
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