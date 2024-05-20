<script lang="ts">
  import ProcessSpecificationModal from "$lib/ProcessSpecificationModal.svelte"
  // import resourceSpecifications from '$lib/data/resource_specifications.json'
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import type { ComponentType } from 'svelte'
  import { mutation, query } from 'svelte-apollo'
  import type { ReadableQuery } from 'svelte-apollo'
  import { gql } from 'graphql-tag'
  import type { AgentConnection, Agent, UnitConnection } from '@valueflows/vf-graphql'
  import type { RelayConn } from '$lib/graphql/helpers'
  import { PROCESS_SPECIFICATION_CORE_FIELDS } from '$lib/graphql/process_specification.fragments'
  import { flattenRelayConnection } from '$lib/graphql/helpers'
  import type { Facet, FacetGroup } from "$lib/graphql/extension-schemas"
  import { addHashChange } from "../../utils"
  import Header from "$lib/Header.svelte"
  import Export from "$lib/Export.svelte"

  let modalOpen = false;
  let editing = false;
  let name = "";
  let id = "";
  let currentProcessSpecification: any;
  let units: any[];
  let handleSubmit: any;
  let importing: boolean = false;

  const GET_ALL_PROCESS_SPECIFICATIONS = gql`
    ${PROCESS_SPECIFICATION_CORE_FIELDS}
    query {
      processSpecifications(last: 100000) {
        edges {
          cursor
          node {
            ...ProcessSpecificationCoreFields
          }
        }
      }
    }
  `

  interface QueryResponse {
    processSpecifications: AgentConnection & RelayConn<any>
  }

  // DELETE PROCESS SPECIFICATION
  const DELETE_PROCESS_SPECIFICATION = gql`mutation($revisionId: ID!){
    deleteProcessSpecification(revisionId: $revisionId)
  }`
  let deleteProcessSpecification: any = mutation(DELETE_PROCESS_SPECIFICATION)

  async function deleteAProcessSpec(revisionId: string) {
    let areYouSure = await confirm("Are you sure you want to delete this process specification?")
    if (areYouSure == true) {
      const res = await deleteProcessSpecification({ variables: { revisionId } })
      console.log(res)
      await fetchProcessSpecifications()
    }
  }
  // DELETE PROCESS SPECIFICATION ENDS

  // map component state
  let processSpecificationsQuery: ReadableQuery<QueryResponse> = query(GET_ALL_PROCESS_SPECIFICATIONS)

  async function fetchProcessSpecifications() {
    await processSpecificationsQuery.getCurrentResult()
    let x = await processSpecificationsQuery.refetch()
    console.log(x)
    // setTimeout(function(){
    await processSpecificationsQuery.refetch().then((r) => {
        processSpecifications = flattenRelayConnection(r.data?.processSpecifications).map((a) => {
          return {
            ...a,
          }
        })
        console.log(processSpecifications)
      })
    // }, 1000)
  }

  onMount(async () => {
    if (browser) {
      await fetchProcessSpecifications()
    }
  })

  // reactive data bindings
  let processSpecifications: any[]

  $: processSpecifications, modalOpen, editing, id, currentProcessSpecification, units;
</script>

<!-- <div style="height: 8vh"> -->
  <Header title="Process Specifications" description="The types of processes your network creates, uses, trades; types of work; currencies, tokens." />
<!-- </div> -->
<!-- <Units /> -->
<ProcessSpecificationModal bind:handleSubmit bind:open={modalOpen} {name} {editing} {currentProcessSpecification} on:submit={fetchProcessSpecifications} />

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
        on:click={() => {modalOpen = true; editing = false; currentProcessSpecification = {}; console.log('o')}}
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a process specification</button>
    </div>
    <Export bind:importing dataName="list of Process Specifications" fileName="cfn-process-specifications" data={processSpecifications}
    on:import={async (event) => {
      for (let i = 0; i < event.detail.length; i++) {
        let newPS = await handleSubmit(event.detail[i])
        await addHashChange(event.detail[i].id, newPS.data.createProcessSpecification.processSpecification.id)
      }
      console.log("++++++++++++FINSIHED++++++++++++")
      importing = false
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
                class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                >Description</th
              >
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white">
            <!-- Odd row -->
            {#if processSpecifications}
            {#each processSpecifications as processSpecification, index}
            <tr class="{index % 2 == 0 ? 'bg-gray-100': ''}">
              <td
                class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3"
                >{processSpecification.name}</td
              >
              <td
                class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3"
                >{processSpecification.note}</td
              >
              <td
                class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
              >
                <button type="button" on:click={() => {
                  name = processSpecification.name; 
                  currentProcessSpecification = processSpecification; 
                  editing=true; modalOpen = true
                 
                  }}  class="text-indigo-600 hover:text-indigo-900"
                  >Edit<span class="sr-only">, Lindsay Walton</span></button
                >
                &nbsp;
                <button type="button" on:click={() => {
                  deleteAProcessSpec(processSpecification.revisionId)
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
