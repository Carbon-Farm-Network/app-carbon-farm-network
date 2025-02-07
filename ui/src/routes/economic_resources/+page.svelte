<script lang="ts">
    import type { EconomicResource, Agent }  from '@leosprograms/vf-graphql'
    import Header from "$lib/Header.svelte";
    import EconomicResourceModal from "./EconomicResourceModal.svelte";
    import { onMount } from "svelte";
    import { getAllEconomicResources, getAllProcessSpecifications, getAllUnits } from "../../crud/fetch";
    import { updateEconomicResource, createEconomicEventWithResource } from '../../crud/commit';
    import { allEconomicResources, allAgents, allUnits, allResourceSpecifications, allProcessSpecifications } from "../../crud/store";
    import EconomicEventModal from '../economic_events/EconomicEventModal.svelte';
    import Loading from '$lib/Loading.svelte';
    import { cloneDeep } from 'lodash';

    let loading: boolean = false;

    let economicResources: EconomicResource[] = [];
    allEconomicResources.subscribe(value => {
        economicResources = value;
    });

    let agents: Agent[] = [];
    allAgents.subscribe(value => {
        agents = value;
    });
    
    let units: any[] = [];
    allUnits.subscribe(value => {
        units = value;
    });

    let resourceSpecifications: any[] = [];
    allResourceSpecifications.subscribe(value => {
        resourceSpecifications = value;
    });

    let processSpecifications: any[] = [];
    allProcessSpecifications.subscribe(value => {
        processSpecifications = value;
    });

    let modalOpen = false;
    let economicEventModalOpen = false;
    let selectedEconomicResource: EconomicResource | null = null;
    $: selectedEconomicResource;

    onMount(async () => {
      loading = economicResources.length === 0 || units.length === 0 || processSpecifications.length === 0;
      await getAllEconomicResources();
      console.log('economicResources', economicResources);
      await getAllProcessSpecifications();
      await getAllUnits();
      loading = false;
    });
</script>

<Header title="Economic resources" description="The economic resources in a network." />

<EconomicResourceModal bind:open={modalOpen} economicResource={selectedEconomicResource} {units} {processSpecifications}
  on:submit={async (e) => {
    selectedEconomicResource = null;
    modalOpen = false;
    await getAllEconomicResources()
    // console.log(e.detail.economicResource);
    // let updatedEconomicResource = {
    //   revisionId: e.detail.economicResource.revisionId,
    //   trackingIdentifier: "test",
    // }
    // updateEconomicResource(updatedEconomicResource);
  }}
/>

<EconomicEventModal bind:open={economicEventModalOpen} agents={agents} resourceSpecifications={resourceSpecifications} units={units} raiseOnly={true}
  on:submit={async (e) => {
    console.log("raw", e)
    let event = cloneDeep(e.detail.event);
    event.hasPointInTime = new Date(),
    event.hasBeginning = new Date(),
    event.resourceConformsTo = event.resourceConformsTo?.id || event.resourceConformsTo;
    event.provider = event.providerId;
    event.receiver = event.receiverId;
    event.resourceQuantity.hasUnit = event.resourceQuantity?.hasUnitId;
    let resource = cloneDeep(e.detail.resource);
    resource.conformsTo = resource.conformsTo?.id || resource.conformsTo;
    console.log("resource", resource);
    await createEconomicEventWithResource(event, resource);
    await getAllEconomicResources();
  }}
/>

{#if loading}
  <Loading />
{/if}

<div class="p-12">

<div class="sm:flex sm:items-center">
  <div class="sm:flex-auto">
  </div>
  <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
    <button
      type="button"
      on:click={() => {
        economicEventModalOpen = true;
      }}
      class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >Beginning Balance</button>
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
                >Accounting Quantity</th
              >
              <!-- <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Note</th
              > -->
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Stage</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Note</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Tracking Identifier</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                ></th
              >
            </tr>
          </thead>
          <tbody class="bg-white">
            {#each economicResources as economicResource}
              <tr>
                <td class="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {economicResource?.name}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {economicResource?.accountingQuantity?.hasNumericalValue} 
                  {units.find(unit => unit.id === economicResource.accountingQuantity?.hasUnitId)?.label}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  <!-- {economicResource?.stageId != "undefined" ? processSpecifications.find(spec => spec.id === economicResource?.stageId)?.name : "-"} -->
                   {economicResource?.stage?.name}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {economicResource?.note ? economicResource?.note : "-"}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {economicResource?.trackingIdentifier}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">

                  <button type="button" on:click={() => {
                    selectedEconomicResource = economicResource;
                    modalOpen = true;
                    }}  class="text-indigo-600 hover:text-indigo-900"
                    >Edit<span class="sr-only">, Lindsay Walton</span></button>
                </td>
              </tr>
            {/each}
            </tbody>
        </table>
        </div>
    </div>
</div>
</div>
