<script lang="ts">
  import ResourceSpecificationModal from "$lib/ResourceSpecificationModal.svelte"
  // import resourceSpecifications from '$lib/data/resource_specifications.json'
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import type { ComponentType } from 'svelte'
  import { mutation, query } from 'svelte-apollo'
  import type { ReadableQuery } from 'svelte-apollo'
  import { gql } from 'graphql-tag'
  import type { AgentConnection, Agent, UnitConnection } from '@valueflows/vf-graphql'
  import type { RelayConn } from '$lib/graphql/helpers'
  import { FACET_VALUE_CORE_FIELDS, FACET_GROUP_CORE_FIELDS } from '$lib/graphql/facet.fragments'
  import { RESOURCE_SPECIFICATION_CORE_FIELDS, UNIT_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'
  import { flattenRelayConnection } from '$lib/graphql/helpers'
  import type { Facet, FacetGroup } from "$lib/graphql/extension-schemas"
  import Header from "$lib/Header.svelte"

  let modalOpen = false;
  let editing = false;
  let name = "";
  let id = "";
  let currentResourceSpecification: any;
  let units: any[];
  let facets: Facet[] | undefined;
  let selectedFacets: any = {};

  const GET_FACET_GROUPS = gql`
    ${FACET_GROUP_CORE_FIELDS}
    query GetFacets {
      facetGroups {
        ...FacetGroupCoreFields
      }
    }
  `

  const GET_ALL_RESOURCE_SPECIFICATIONS = gql`
    ${RESOURCE_SPECIFICATION_CORE_FIELDS}
    ${FACET_VALUE_CORE_FIELDS}
    ${UNIT_CORE_FIELDS}
    query {
      resourceSpecifications(last: 100000) {
        edges {
          cursor
          node {
            ...ResourceSpecificationCoreFields
            defaultUnitOfResource {
              ...UnitCoreFields
            }
            facets {
              ...FacetValueCoreFields
            }
          }
        }
      }
    }
  `

const GET_UNITS = gql`
    query GetUnits {
      units {
        edges {
          cursor
          node {
            id
            label
            symbol
          }
        }
      }
    }
  `

  interface UnitsQueryResponse {
    units: UnitConnection & RelayConn<any> //& RelayConn<unknown> | null | undefined
  }
  let getUnits: ReadableQuery<UnitsQueryResponse> = query(GET_UNITS)

  interface QueryResponse {
    resourceSpecifications: AgentConnection & RelayConn<any>
  }

  // DELETE RESOURCE SPECIFICATION
  const DELETE_RESOURCE_SPECIFICATION = gql`mutation($revisionId: ID!){
    deleteResourceSpecification(revisionId: $revisionId)
  }`
  let deleteResourceSpecification: any = mutation(DELETE_RESOURCE_SPECIFICATION)

  async function deleteAResourceSpec(revisionId: string) {
    let areYouSure = await confirm("Are you sure you want to delete this resource specification?")
    if (areYouSure == true) {
      const res = await deleteResourceSpecification({ variables: { revisionId } })
      console.log(res)
      await fetchResourceSpecifications()
    }
  }
  // DELETE RESOURCE SPECIFICATION ENDS

  // map component state
  let resourceSpecificationsQuery: ReadableQuery<QueryResponse> = query(GET_ALL_RESOURCE_SPECIFICATIONS)

  async function fetchResourceSpecifications() {
    await resourceSpecificationsQuery.getCurrentResult()
    let x = await resourceSpecificationsQuery.refetch()
    console.log(x)
    // setTimeout(function(){
    await resourceSpecificationsQuery.refetch().then((r) => {
        resourceSpecifications = flattenRelayConnection(r.data?.resourceSpecifications).map((a) => {
          return {
            ...a,
            defaultUnitOfResourceId: a.defaultUnitOfResource?.id,
          }
        })
        console.log(resourceSpecifications)
      })
    // }, 1000)
  }

  interface FacetGroupResponse {
    facetGroups: FacetGroup[]
  }
  let queryFacetGroups: ReadableQuery<FacetGroupResponse> = query(GET_FACET_GROUPS)

  async function fetchFacets() {
    await queryFacetGroups.getCurrentResult()
    let y = await queryFacetGroups.refetch()
    let facetGroups = y.data.facetGroups
    facets = facetGroups.find((g) => {return g.name == "Resource Specification"})?.facets
    console.log(facets)
  }

  async function fetchUnits() {
    await getUnits.getCurrentResult()
      getUnits.refetch().then((r) => {
        if (r.data?.units.edges.length > 0) {
          units = flattenRelayConnection(r.data?.units).map((a) => {
            return {
              ...a,
            }
          })
        }
      })
  }

  onMount(async () => {
    if (browser) {
      await fetchResourceSpecifications()
      await fetchFacets()
      await fetchUnits()
    }
  })

  // reactive data bindings
  let resourceSpecifications: any[]

  $: resourceSpecifications, modalOpen, editing, id, currentResourceSpecification, units;
</script>

<div style="height: 8vh">
  <Header title="Resource Specifications" description="The types of resources your network creates, uses, trades; types of work; currencies, tokens." />
</div>
<!-- <Units /> -->
{#if units}
<ResourceSpecificationModal bind:open={modalOpen} {units} {facets} {name} {editing} {currentResourceSpecification} {selectedFacets} on:submit={fetchResourceSpecifications} />
{/if}

<div class="p-12">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <!-- <h1 class="text-base font-semibold leading-6 text-gray-900">Resource specifications</h1>
      <p class="mt-2 text-sm text-gray-700">
        The types of resources your network creates, uses, trades; types of work; currencies, tokens.
      </p> -->
    </div>
    <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
      <button
        type="button"
        on:click={() => {modalOpen = true; editing = false; currentResourceSpecification = {}}}
        class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a resource specification</button>
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
                {resourceSpecification.defaultUnitOfResource.label || ''}</td
              >
              <!-- <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                >{resourceSpecification.defaultUnitOfEffort || ''}</td
              > -->
              {#if facets}
              {#each facets as facet}
              {@const facetValue = resourceSpecification.facets.findLast((f) => {return f.facet.id == facet.id})?.value}
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
                  currentResourceSpecification.facets.map((f) => {
                    selectedFacets[f.facet.id] = f.id
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
