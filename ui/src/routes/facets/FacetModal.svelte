<script lang="ts">
  import { clickOutside } from '../../utils'
  import gql from 'graphql-tag'
  import { mutation } from 'svelte-apollo';
  import { onMount } from 'svelte'
  import type { FacetGroup, FacetParams, FacetValueParams } from "$lib/graphql/extension-schemas"
  import { createEventDispatcher } from 'svelte';
  import { createFacet, createFacetValue } from '../../crud/commit';
  export let open = false
  export let facetGroups: FacetGroup[];
  export let currentFacetGroup: FacetGroup;
  export let currentFacet: any;

  let name = ''
  let description = ''

  function checkKey(e: any) {
    if (e.key === "Escape" && !e.shiftKey) {
      e.preventDefault();
      open = false;
    }
  }

  onMount(() => {
    window.addEventListener("keydown", checkKey);
  });

  const dispatch = createEventDispatcher();

  // const CREATE_FACET = gql`
  //   mutation($facet: FacetParams!){
  //     putFacet(facet: $facet) {
  //       facet {
  //         name
  //         note
  //         id
  //         revisionId
  //       }
  //     }
  //   }
  // `
  // const CREATE_VALUE = gql`
  //   mutation($facetValue: FacetValueParams!){
  //     putFacetValue(facetValue: $facetValue) {
  //       facetValue {
  //         value
  //         note
  //         id
  //         revisionId
  //       }
  //     }
  //   }
  // `
  // let addFacet: any = mutation(CREATE_FACET)
  // let addValue: any = mutation(CREATE_VALUE)

  export async function submit(facet, facetGroup) {
    // let groupID: String = facetGroups[0].id

    let f = await createFacet({
      name: facet.name,
      note: facet.note,
      facetGroupId: facetGroup.id
    })

    // let f = await addFacet({
    //   variables: {
    //     facet: {
    //       name: facet.name,
    //       note: facet.note,
    //       facetGroupId: facetGroup.id
    //     }
    //   }
    // })
    console.log(f)
    dispatch("submit")
    open = false
    return f
  }

  onMount(async () => {
    // console.log('groups: ')
    // console.log(facetGroups)
    // let groupID: String = facetGroups[0].id

    // let f = await addFacet({
    //   variables: {
    //     facet: {
    //       name: "facet 1",
    //       note: "note",
    //       facetGroupId: facetGroups[0].id
    //     }
    //   }
    // })
    // console.log(f)
    // let facetId: string = f.data.putFacet.facet.id
    // console.log(facetId)

    // try {
    //   let v = await addValue({
    //     variables: {
    //       facetValue: {
    //         value: "value 1",
    //         note: "note",
    //         facetId,
    //       }
    //     }
    //   })
    //   console.log(v)
    // } catch (e) {
    //   console.log(e)
    // }
    
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
      <!-- <div
        class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
        class:hidden={!open}
        use:clickOutside
        on:outclick={() => (open = false)}
      > -->
      <div
        class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
        class:hidden={!open}
        use:clickOutside
      >
        <div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
              Add a facet
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
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder=""
                    bind:value={currentFacet.name}
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
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Description
                </label>
                <div class="mt-2">
                  <textarea
                    id="note"
                    bind:value={currentFacet.note}
                    name="note"
                    rows="3"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
                <!-- <p class="mt-3 text-sm leading-6 text-gray-600">
                  Description of the facet.
                </p> -->
              </div>
            </div>
          </div>
        </div>
        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
            on:click={() => submit(currentFacet, currentFacetGroup)}
            >Create</button
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
