<script lang="ts">
  import ProcessSpecificationModal from "./ProcessSpecificationModal.svelte"
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import { addHashChange } from "../../crud/commit"
  import Header from "$lib/Header.svelte"
  import Loading from "$lib/Loading.svelte"
  import Export from "$lib/Export.svelte"
  import SvgIcon from "$lib/SvgIcon.svelte"
  import { getAllProcessSpecifications } from "../../crud/fetch"
  import { deleteProcessSpecification } from "../../crud/commit"
  import { allProcessSpecifications } from "../../crud/store"

  let modalOpen: boolean = false;
  let exportOpen: boolean = false;
  let loading: boolean = false;
  let fetching: boolean = false;
  let editing: boolean = false;
  let name = "";
  let id = "";
  let currentProcessSpecification: any;
  let units: any[];
  let handleSubmit: any;
  
  async function deleteAProcessSpec(revisionId: string) {
    let areYouSure = await confirm("Are you sure you want to delete this process specification?")
    if (areYouSure == true) {
      const res = await deleteProcessSpecification(revisionId)
      await getAllProcessSpecifications()
    }
  }
  
  async function refresh() {
    fetching = true
    await getAllProcessSpecifications()
    fetching = false
  }

  // DELETE PROCESS SPECIFICATION ENDS
  onMount(async () => {
    if (browser) {
      loading = processSpecifications.length == 0
      if (loading) {
        await getAllProcessSpecifications()
        loading = false
      }
    }
  })

  // reactive data bindings
  let processSpecifications: any[]
  allProcessSpecifications.subscribe((value) => {
    processSpecifications = value
    console.log("processSpecifications", processSpecifications)
  })

  $: processSpecifications, modalOpen, editing, id, currentProcessSpecification, units, exportOpen;
</script>

<!-- <div style="height: 8vh"> -->
  <Header title="Process Specifications" description="The types of processes your network creates, uses, trades; types of work; currencies, tokens." />
<!-- </div> -->
<!-- <Units /> -->
<ProcessSpecificationModal bind:handleSubmit bind:open={modalOpen} {name} {editing} {currentProcessSpecification} on:submit={getAllProcessSpecifications} />

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
        on:click={() => {modalOpen = true; editing = false; currentProcessSpecification = {};}}
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a process specification</button>
    </div>
    <!-- <Export bind:open={exportOpen} dataName="list of Process Specifications" fileName="cfn-process-specifications" data={processSpecifications}
    on:import={async (event) => {
      for (let i = 0; i < event.detail.length; i++) {
        let newPS = await handleSubmit(event.detail[i])
        await addHashChange(event.detail[i].id, newPS.data.createProcessSpecification.processSpecification.id)
      }
      exportOpen = false
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
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
