<script lang="ts">
  import FacetModal from "$lib/FacetModal.svelte"
  // import allFacetGroups from '$lib/data/facet_groups.json'
  // import facets from '$lib/data/facets.json'
  import { FACET_GROUP_CORE_FIELDS } from "$lib/graphql/facet.fragments"
  import type { Facet, FacetGroup, FacetParams, FacetGroupParams } from "$lib/graphql/extension-schemas"
  import type { ReadableQuery } from 'svelte-apollo'
  import { mutation, query } from 'svelte-apollo'
  import gql from 'graphql-tag'
  import { onMount } from 'svelte'
  import { addHashChange } from "../../crud/commit"
  import { goto } from '$app/navigation';
  import Header from "$lib/Header.svelte"
  import Export from "$lib/Export.svelte"

  function navigate(location: string) {
    goto(location);
  }
  let modalOpen = false;
  let selectedId: string;
  let currentFacetGroup: FacetGroup | undefined;
  let facetGroups: FacetGroup[];
  let currentFacet: any = {name: '', note: ''};
  let addFacet: any;
  let addFacetGroup: any;
  let addFacetValue: any;
  let importing: boolean = false;
  let showExport: boolean = false;


  // DELETE FACET
  const DELETE_FACET = gql`mutation($revisionId: ID!){
    deleteFacetOption(revisionId: $revisionId)
  }`
  let deleteFacetOption: any = mutation(DELETE_FACET)

  async function deleteFacet(revisionId: string) {
    let areYouSure = await confirm("Are you sure you want to delete this facet?")
    if (areYouSure == true) {
      console.log(revisionId)
      const res = await deleteFacetOption({ variables: { revisionId } })
      console.log(res)
      await fetchFacets()
    }
  }
  // DELETE FACET

  const GET_FACET_GROUPS = gql`
    ${FACET_GROUP_CORE_FIELDS}
    query GetFacets {
      facetGroups {
        ...FacetGroupCoreFields
      }
    }
  `

  interface FacetGroupResponse {
    facetGroups: FacetGroup[]
  }
  let queryFacetGroups: ReadableQuery<FacetGroupResponse> = query(GET_FACET_GROUPS)

  // let addFacet: any = mutation(CREATE_FACET)

  async function fetchFacets() {
    let y = await queryFacetGroups.refetch()
    let selectedGroupId: String;
    if (currentFacetGroup) {
      selectedGroupId = currentFacetGroup.id;
    } else {
      selectedGroupId = y.data.facetGroups[0].id
    }
    facetGroups = y.data.facetGroups
    currentFacetGroup = facetGroups.find((g) => {return g.id == selectedGroupId})
  }

  const CREATE_VALUE = gql`
    mutation($facetValue: FacetValueParams!){
      putFacetValue(facetValue: $facetValue) {
        facetValue {
          value
          note
          id
          revisionId
        }
      }
    }
  `
  let addValue: any = mutation(CREATE_VALUE)

  async function importData(data: any) {
    console.log("importing data", data)
    // add facets
    for (let i = 0; i < data.length; i++) {
      // let facetGroup: FacetGroupParams = {
      //   name: data[i].name,
      //   note: data[i].note
      // }
      // let g = await addFacetGroup(facetGroup)
      // console.log(g)

      let facetGroupId = data[i].id
      console.log(facetGroupId)

      let facets = data[i].facets

      for (let j = 0; j < facets.length; j++) {
        let facet: FacetParams = {
          name: facets[j].name,
          note: facets[j].note,
          // facetGroupId: g.data.putFacetGroup.facetGroup.id
          facetGroupId: facetGroupId
        }
        let f = await addFacet(facet, {id: facetGroupId})
        console.log(f)
        addHashChange(facets[j].id, f.data.putFacet.facet.id)

        // add facet values
        let facetValues = facets[j].values
        for (let k = 0; k < facetValues.length; k++) {
          let facetValue = {
            value: facetValues[k].value,
            note: facetValues[k].note,
            facetId: f.data.putFacet.facet.id
          }

          let fv = await addValue({ variables: { facetValue } })
          console.log(fv)
          addHashChange(facetValues[k].id, fv.data.putFacetValue.facetValue.id)

          console.log(fv)
        }
      }
    }
    importing = false
    showExport = false
    console.log("imported data ......")
  }

  onMount(async () => {
    await fetchFacets()
    currentFacetGroup = facetGroups[0]
  })

  $: facetGroups, currentFacetGroup, importing;

</script>

<!-- <div style="height: 8vh"> -->
  <Header title="Facets" description="A list of all the facets and their values for the facet group." />
<!-- </div> -->

{#if facetGroups && currentFacetGroup}
<FacetModal 
bind:facetGroups 
bind:submit={addFacet} 
bind:open={modalOpen} 
bind:currentFacetGroup
bind:currentFacet 
on:submit={fetchFacets} />
{/if}

{#if true}
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

      <!-- <h1 class="text-base font-semibold leading-6 text-gray-900 pt-6">Facets</h1>
      <p class="mt-2 text-sm text-gray-700">
        A list of all the facets and their values for the facet group.
      </p> -->
    </div>
    <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
      <button
        type="button"
        on:click={() => {
          modalOpen = true;
          currentFacet = {name: '', note: ''};
        }}
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a facet</button
      >
    </div>
    <Export dataName="Facets" fileName="cfn-facets" data={facetGroups}
      bind:importing
      bind:open={showExport}
      on:import={(e) => {
        console.log("importing data", e.detail)
        importData(e.detail)
      }}
    />
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
              <!-- <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Order</th
              > -->
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Values</th
              >
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit facet</span>
              </th>
              <!-- <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit facet values</span>
              </th> -->
            </tr>
          </thead>
          <tbody class="bg-white">
            <!-- Odd row -->
            <!-- {#each facets as {id, name, description, order, values}, index} -->
            {#if currentFacetGroup && currentFacetGroup.facets}
            {#each currentFacetGroup.facets as facet, index}
            
            <tr class="{index % 2 == 0 ? 'bg-gray-100': ''}">
              <td
                class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3"
                >{facet.name}</td
              >
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                >{facet.note}</td
              >
              <!-- <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
              >-->
              <!-- <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                >{values.join(", ")}</td
              > -->
              {#if facet.values}
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                >{facet.values.map((v) => {return v.value}).join(', ')}</td
              >
              {/if}
              <!-- <td
                class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
                <button type="button" on:click={() => {
                  modalOpen = true;
                  currentFacet = facet;
                }}
                class="text-indigo-600 hover:text-indigo-900"
                  >Edit facet<span class="sr-only">, Lindsay Walton</span></button
                >
              </td> -->
              <td
                class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
              >
              <a on:click={() => navigate('/facet_values/' + facet.id + '')}
                class="text-indigo-600 hover:text-indigo-900" style="cursor: pointer"
                  >Edit values<span class="sr-only">, Lindsay Walton</span></a
                >
                &nbsp;&nbsp;
                <button on:click={() => {deleteFacet(facet.revisionId)}} type="button" class="text-indigo-600 hover:text-indigo-900"
                  >Delete facet<span class="sr-only">, Lindsay Walton</span></button
                >
              </td>
            </tr>
            {/each}
            {/if}

            <!-- More people... -->
          </tbody>
          {#if false}
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
          {/if}
        </table>
      </div>
    </div>
  </div>
</div>
{/if}