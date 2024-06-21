<script lang="ts">
    import type { EconomicEvent, Agent }  from '@valueflows/vf-graphql'
    import Header from "$lib/Header.svelte";
    import { onMount } from "svelte";
    import { getAllEconomicEvents, getAllUnits } from "../../crud/fetch";
    import { allEconomicEvents, allAgents, allUnits, allResourceSpecifications } from "../../crud/store";

    let economicEvents: EconomicEvent[] = [];
    allEconomicEvents.subscribe(value => {
        economicEvents = value;
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
        await getAllEconomicEvents();
        await getAllUnits();
    });
</script>

<Header title="Economic events" description="The economic events in a network." />
    
<div class="mt-8 flow-root">
    <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
        <table class="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th
                scope="col"
                class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                >Provider</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Receiver</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Action</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Resources</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Date</th
                >
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white">
            {#each economicEvents as economicEvent}
              <tr>
                <td class="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {agents.find(agent => agent.id === economicEvent.providerId)?.name}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {agents.find(agent => agent.id === economicEvent.receiverId)?.name}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {economicEvent.action?.label}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {economicEvent.resourceQuantity?.hasNumericalValue} 
                    {units.find(unit => unit.id === economicEvent.resourceQuantity?.hasUnitId)?.label}
                    {economicEvent?.resourceConformsTo?.name}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(economicEvent?.hasBeginning).toLocaleDateString()}
                </td>
              </tr>
            {/each}
            </tbody>
        </table>
        </div>
    </div>
</div>