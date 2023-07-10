<script lang="ts">
  import FacetModal from "$lib/FacetModal.svelte"
  import allFacetGroups from '$lib/data/facet_groups.json'
  import facets from '$lib/data/facets.json'
  import type { Facet, FacetGroup, FacetParams } from "$lib/graphql/extension-schemas"
  import type { ReadableQuery } from 'svelte-apollo'
  import { mutation, query } from 'svelte-apollo'
  import gql from 'graphql-tag'
  import { onMount } from 'svelte'
  let modalOpen = false;
  let selectedId: string;
  let currentFacetGroup: FacetGroup;
  let facetGroups: FacetGroup[];
  let currentFacet: any = {name: '', note: ''};


  const GET_FACET_GROUPS = gql`
    query GetFacets {
      facetGroups {
        id
        revisionId
        name
        note
        #facets {
          # id
          #revisionId
          #name
          #note
          # group {
          #   id
          # }
          #values {
            #id
            #revisionId
            #value
            #note
            # facet {
            #   id
            # }
          #}
        #}
      }
    }
  `

  interface FacetGroupResponse {
    facetGroups: FacetGroup[]
  }
  let queryFacetGroups: ReadableQuery<FacetGroupResponse> = query(GET_FACET_GROUPS)

  // let addFacet: any = mutation(CREATE_FACET)

  onMount(async () => {
    let x = await queryFacetGroups.getCurrentResult()
    console.log(x)
    let y = await queryFacetGroups.refetch()
    console.log(y)
    facetGroups = y.data.facetGroups
    currentFacetGroup = facetGroups[0]
    // console.log('GGG', facetGroups)
  })

  $: facetGroups, currentFacetGroup;

</script>

{#if facetGroups && currentFacetGroup}
<FacetModal bind:facetGroups bind:open={modalOpen} bind:currentFacetGroup bind:currentFacet />
{/if}

<div class="p-12">
  <div class="sm:flex sm:items-center">

    <div class="sm:flex-auto">

      <div>
        <label for="facetGroup" class="block text-sm font-medium leading-6 text-gray-900">Facet group</label>
        <select id="facetGroup" name="location" class="mt-2 block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 w-48"
        bind:value={currentFacetGroup}>
          {#if facetGroups}
          {#each facetGroups as facetGroup}
            <option value={facetGroup}>{facetGroup.name}</option>
          {/each}
          {/if}
        </select>
      </div>

      <h1 class="text-base font-semibold leading-6 text-gray-900 pt-6">Facets</h1>
      <p class="mt-2 text-sm text-gray-700">
        A list of all the facets and their values for the facet group.
      </p>
    </div>
    <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
      <button
        type="button"
        on:click={() => (modalOpen = true)}
        class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a facet</button
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
                >Name</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Description</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Order</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Values</th
              >
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit facet</span>
              </th>
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit facet values</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white">
            <!-- Odd row -->
            {#each facets as {id, name, description, order, values}, index}
            <tr class="{index % 2 == 0 ? 'bg-gray-100': ''}">
              <td
                class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3"
                >{name}</td
              >
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                >{description}</td
              >
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                >{order}</td
              >
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                >{values.join(", ")}</td
              >
              <td
                class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
              >
                <button type="button" on:click={() => {selectedId = id; modalOpen = true}}  class="text-indigo-600 hover:text-indigo-900"
                  >Edit facet<span class="sr-only">, Lindsay Walton</span></button
                >
              </td>
              <td
                class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
              >
                <a href={`/facet_values/${id}`} class="text-indigo-600 hover:text-indigo-900"
                  >Edit values<span class="sr-only">, Lindsay Walton</span></a
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
