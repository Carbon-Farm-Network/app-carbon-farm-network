<script lang="ts">
    import type { EconomicResource, Agent }  from '@valueflows/vf-graphql'
    import Header from "$lib/Header.svelte";
    import { onMount } from "svelte";
    import { getAllEconomicResources, getAllUnits } from "../../crud/fetch";
    import { allEconomicResources, allAgents, allUnits, allResourceSpecifications } from "../../crud/store";
    import { get } from 'svelte/store'

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

    onMount(async () => {
        await getAllEconomicResources();
        await getAllUnits();
    });
</script>

<Header title="Economic resources" description="The economic resources in a network." />
    
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
                >Note</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Accounting Quantity</th
              >
              
              <!-- <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit</span>
              </th> -->
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
                  {economicResource?.note}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {economicResource?.accountingQuantity?.hasNumericalValue} 
                  {units.find(unit => unit.id === economicResource.accountingQuantity?.hasUnit?.id)?.label}
                </td>
              </tr>
            {/each}
            </tbody>
        </table>
        </div>
    </div>
</div>