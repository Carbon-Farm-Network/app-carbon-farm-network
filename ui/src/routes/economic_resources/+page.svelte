<script lang="ts">
    import type { EconomicResource, Agent }  from '@leosprograms/vf-graphql'
    import Header from "$lib/Header.svelte";
    import EconomicResourceModal from "./EconomicResourceModal.svelte";
    import { onMount } from "svelte";
    import { getAllEconomicResources, getAllProcessSpecifications, getAllUnits } from "../../crud/fetch";
    import { updateEconomicResource } from '../../crud/commit';
    import { allEconomicResources, allAgents, allUnits, allResourceSpecifications, allProcessSpecifications } from "../../crud/store";
    import Loading from '$lib/Loading.svelte';

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
  on:submit={(e) => {
    console.log('submit');
    modalOpen = false;
    // console.log(e.detail.economicResource);
    // let updatedEconomicResource = {
    //   revisionId: e.detail.economicResource.revisionId,
    //   trackingIdentifier: "test",
    // }
    // updateEconomicResource(updatedEconomicResource);
  }}
/>

{#if loading}
  <Loading />
{/if}

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
                  <!-- {economicResource.id} -->
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {economicResource?.accountingQuantity?.hasNumericalValue} 
                  {units.find(unit => unit.id === economicResource.accountingQuantity?.hasUnitId)?.label}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {economicResource?.stageId != "undefined" ? processSpecifications.find(spec => spec.id === economicResource?.stageId)?.name : "-"}
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