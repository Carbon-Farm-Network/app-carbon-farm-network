<script lang="ts">
  import ResourceSpecificationModal from "./ResourceSpecificationModal.svelte"
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import { mutation, query } from 'svelte-apollo'
  import { gql } from 'graphql-tag'
  import type { Facet, FacetGroup } from "$lib/graphql/extension-schemas"
  import Header from "$lib/Header.svelte"
  import Loading from "$lib/Loading.svelte"
  import SvgIcon from "$lib/SvgIcon.svelte"
  import Export from "$lib/Export.svelte"
  import { addHashChange } from "../../crud/commit"
  import { getAllResourceSpecifications, getAllUnits } from "../../crud/fetch"
  import { deleteResourceSpecification } from "../../crud/commit"
  import { allResourceSpecifications, allFacetGroups } from "../../crud/store"

  let modalOpen = false;
  let editing = false;
  let exportOpen = false;
  let name = "";
  let id = "";
  let currentResourceSpecification: any;
  let units: any[];
  // let facets: Facet[] | undefined;
  let facets: Facet[] | undefined;
  let selectedFacets: any = {};
  let handleSubmit: any;
  let loading: boolean = false;
  let fetching: boolean = false;
  let importing: boolean = false;
  let resourceSpecifications: any[]

  allResourceSpecifications.subscribe((value) => {
    resourceSpecifications = value.map((rs) => {
      return {
        ...rs,
        defaultUnitOfResourceId: rs.defaultUnitOfResource?.id
      }
    })
  })

  allFacetGroups.subscribe((value) => {
    console.log("facet groups", value.find((g) => {return g.name == "Resource Specification"})?.facetOptions)
    facets = value.find((g) => {return g.name == "Resource Specification"})?.facetOptions
  })

  // DELETE RESOURCE SPECIFICATION
  // const DELETE_RESOURCE_SPECIFICATION = gql`mutation($revisionId: ID!){
  //   deleteResourceSpecification(revisionId: $revisionId)
  // }`
  // let deleteResourceSpecification: any = mutation(DELETE_RESOURCE_SPECIFICATION)

  async function deleteAResourceSpec(revisionId: string) {
    let areYouSure = await confirm("Are you sure you want to delete this resource specification?")
    if (areYouSure == true) {
      const res = await deleteResourceSpecification(revisionId)
      getAllResourceSpecifications()
    }
  }

  async function refresh() {
    fetching = true
    // await getAllUnits()
    await getAllResourceSpecifications()
    fetching = false
  }

  onMount(async () => {
    if (browser) {
      loading = resourceSpecifications.length == 0
      if (loading) {
        // await getAllUnits()
        await getAllResourceSpecifications()
        loading = false
      }
    }
  })

  $: resourceSpecifications, modalOpen, editing, id, currentResourceSpecification, units, handleSubmit
</script>

<Header title="Resource Specifications" description="The types of resources your network creates, uses, trades; types of work; currencies, tokens." />
<ResourceSpecificationModal bind:handleSubmit bind:open={modalOpen} {units} {facets} {name} {editing} {currentResourceSpecification} {selectedFacets} on:submit={getAllResourceSpecifications} />

{#if loading}
<Loading />
{/if}

<div class="p-12">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <!-- <h1 class="text-base font-semibold leading-6 text-gray-900">Resource specifications</h1>
      <p class="mt-2 text-sm text-gray-700">
        The types of resources your network creates, uses, trades; types of work; currencies, tokens.
      </p> -->
    </div>

    <!-- refresh button -->
    <div class="mt-4 sm:ml-4 sm:mt-0 sm:flex-none">
      <button
      type="button"
      disabled={fetching}
      on:click={refresh}
      class="flex items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        <span class="flex items-center" class:animate-spin={fetching}>
          <SvgIcon icon="faRefresh" color="#fff" />
        </span>
      </button>
    </div>

    <div class="mt-4 sm:ml-3 sm:mt-0 sm:flex-none">
      <button
        type="button"
        on:click={() => {modalOpen = true; editing = false; currentResourceSpecification = {}}}
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a resource specification</button>
    </div>
    <!-- <Export bind:importing bind:open={exportOpen} dataName="list of Resource Specifications" fileName="cfn-resource-specifications" data={resourceSpecifications}
      on:import={async (event) => {
        for (let i = 0; i < event.detail.length; i++) {
          let newRS = await handleSubmit(event.detail[i])
          await addHashChange(event.detail[i].id, newRS.data.createResourceSpecification.resourceSpecification.id)
          console.log("added hash change", event.detail[i].id, newRS.data.createResourceSpecification.resourceSpecification.id)
        }
        importing = false
        exportOpen = false
        return
      }}
    /> -->
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
                >Default unit of resource</th
              >
              <!-- <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Default unit of effort</th
              > -->
              <!-- for each facet, create th -->
              {#if facets}
              {#each facets as facet}
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >{facet.name}</th
                >
              {/each}
            {/if}
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white">
            <!-- Odd row -->
            {#if resourceSpecifications}
            {#each resourceSpecifications as resourceSpecification, index}
            <tr class="{index % 2 == 0 ? 'bg-gray-100': ''}">
              <td
                class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3"
                >{resourceSpecification.name}</td
              >
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                >
                {resourceSpecification.defaultUnitOfResource?.label || ''}</td
              >
              <!-- <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                >{resourceSpecification.defaultUnitOfEffort || ''}</td
              > -->
              {#if facets}
              {#each facets as facet}
              {@const facetValue = resourceSpecification.facets?.findLast((f) => {return f.facetId == facet.id})?.value}
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-medium text-gray-900"
                  >
                  {#if facetValue && facetValue != 'undefined'}
                    {facetValue}                    
                  {/if}
              </th>
              {/each}
              {/if}
              <td
                class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
              >
                <button type="button" on:click={() => {
                  name = resourceSpecification.name; 
                  currentResourceSpecification = resourceSpecification;
                  editing=true; modalOpen = true

                  selectedFacets = {};
                  currentResourceSpecification.facets?.map((f) => {
                    selectedFacets[f.facetId] = f.id
                  })
                 
                  }}  class="text-indigo-600 hover:text-indigo-900"
                  >Edit<span class="sr-only">, Lindsay Walton</span></button
                >
                &nbsp;
                <button type="button" on:click={() => {
                  deleteAResourceSpec(resourceSpecification.revisionId)
                }}  class="text-indigo-600 hover:text-indigo-900"
                >Delete<span class="sr-only">, Lindsay Walton</span></button>
              </td>
            </tr>
            {/each}
            {/if}

            <!-- More people... -->
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
