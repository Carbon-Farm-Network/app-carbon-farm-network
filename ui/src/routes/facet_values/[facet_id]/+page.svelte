<script lang="ts">
  import FacetValueModal from "../FacetValueModal.svelte"
  // import facetValues from '$lib/data/facet_values.json'
  import { gql } from 'graphql-tag'
  import { onMount } from 'svelte'
  import { mutation, query } from 'svelte-apollo'
  import type { Facet, FacetGroup, FacetParams, FacetValue } from "$lib/graphql/extension-schemas"
  import { page } from "$app/stores"
  import { goto } from "$app/navigation"
  import { allFacetGroups } from "../../../crud/store"
  import { getAllFacetGroups } from "../../../crud/fetch"
  import { deleteFacetValue } from "../../../crud/commit"
  let modalOpen = false;
  let selectedId: string;
  let localFacet: Facet;
  let facetValues: any[] = [];
  let currentValue: FacetValue;

  let facetGroups: FacetGroup[] = []
  allFacetGroups.subscribe(value => {
    facetGroups = value
  })

  // export let facetId;

  // const GET_FACET_VALUES = gql`
  //   query GetFacetValues {
  //     facetValues {
  //       id
  //       revisionId
  //       value
  //       note
  //     }
  //   }
  // `

  // let facetValuesQuery = query(GET_FACET_VALUES, {
  //   variables: {
  //     facetId
  //   }
  // })


  // DELETE VALUE
  // const DELETE_VALUE = gql`mutation($revisionId: ID!){
  //   deleteFacetValue(revisionId: $revisionId)
  // }`
  // let deleteFacetValue: any = mutation(DELETE_VALUE)

  async function deleteVal(revisionId: string) {
    let areYouSure = await confirm("Are you sure you want to delete this facet value?")
    if (areYouSure == true) {
      const res = await deleteFacetValue( revisionId )
      console.log(res)
      await fetchValues()
    }
  }
  // DELETE VALUE

  // const GET_FACET_GROUPS = gql`
  //   ${FACET_GROUP_CORE_FIELDS}
  //   query GetFacets {
  //     facetGroups {
  //       ...FacetGroupCoreFields
  //     }
  //   }
  // `
  // interface FacetGroupResponse {
  //   facetGroups: FacetGroup[]
  // }
  // let queryFacetGroups: ReadableQuery<FacetGroupResponse> = query(GET_FACET_GROUPS)

  async function fetchValues() {
    console.log('starting')
    let facetId = $page.params.facet_id
    console.log(facetId)
    // await queryFacetGroups.getCurrentResult()
    // let y = await queryFacetGroups.refetch()
    // let facetGroups = y.data.facetGroups
    await getAllFacetGroups()
    for (let facetGroup of facetGroups) {
        if (facetGroup.facetOptions) {
          for (let facet of facetGroup.facetOptions) {
              if (facet.id === facetId) {
                  localFacet = facet
                  currentValue = {value: "", note: "", facetId: localFacet.id, id: "", revisionId: ""}
              }
          }
        }
    }
    if (localFacet.facetValues) {
      facetValues = localFacet.facetValues;
    }
  }

  onMount(async () => {
    // await facetValuesQuery.getCurrentResult();
    // let facetValues = await facetValuesQuery.refetch();
    // console.log(facetValues)
    await fetchValues()
  })

  $: currentValue, localFacet, facetValues;
</script>

<FacetValueModal bind:open={modalOpen} {currentValue} on:submit={fetchValues}/>

{#if localFacet}

<div class="p-12">
  <div class="sm:flex sm:items-center">
    
    <div class="sm:flex-auto">

      
      <h1 class="text-base font-semibold leading-6 text-gray-900 pt-6">
        <button
          type="button"
          class="text-gray-500 hover:text-gray-900"
         on:click={()=>{goto('/facets')}}>↵</button>
        Facet 
        {localFacet.name}
      </h1>
      <p class="mt-2 text-sm text-gray-700">
        A list of all the values for the facet.
      </p>
    </div>
    <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
      <button
        type="button"
        on:click={() => {modalOpen = true; currentValue = {facetId: localFacet.id, note: "", value: "", id: "", revisionId: ""}}}
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a facet value</button
      >
    </div>
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
                >Value</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Description</th
              >
              <!-- <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Order</th
              > -->
              <!-- <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit</span>
              </th> -->
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Delete</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white">
            <!-- Odd row -->
            {#each facetValues as {revisionId, id, value, note, order}, index}
            <!-- {JSON.stringify({revisionId, id, value, note, order})} -->
            <tr class="{index % 2 == 0 ? 'bg-gray-100': ''}">
              <td
                class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3"
                >{value}</td
              >
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                >{note}</td
              >
              <!-- <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                >{order}</td
              > -->
              <!-- <td
                class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
              >
                <button type="button" on:click={() => {selectedId = id; modalOpen = true; currentValue = value}}  class="text-indigo-600 hover:text-indigo-900"
                  >Edit<span class="sr-only">, Lindsay Walton</span></button
                >
              </td> -->
              <td
                class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
              >
                <button on:click={() => {deleteVal(revisionId)}} type="button" class="text-indigo-600 hover:text-indigo-900"
                  >Delete<span class="sr-only">, Lindsay Walton</span></button
                >
              </td>
            </tr>
            {/each}

            <!-- More people... -->
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
{/if}