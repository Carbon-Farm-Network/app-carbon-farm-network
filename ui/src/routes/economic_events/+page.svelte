<script lang="ts">
    import type { EconomicEventCreateParams, Agent, Fulfillment, EconomicResource, EconomicResourceCreateParams }  from '@leosprograms/vf-graphql'
    import Header from "$lib/Header.svelte";
    import { onMount } from "svelte";
    import { getAllEconomicEvents, getAllEconomicResources, getAllResourceSpecifications, getAllUnits } from "../../crud/fetch";
    import { allEconomicEvents, allEconomicResources, allFulfillments, allAgents, allUnits, allResourceSpecifications } from "../../crud/store";
    import { importEconomicEvents } from '../../crud/import';
    import EconomicEventModal from '$lib/EconomicEventModal.svelte';
    import Export from '$lib/Export.svelte';
    import { createEconomicEvent, createEconomicEventWithResource } from '../../crud/commit'
    import EconomicEvent from '$lib/icons/EconomicEvent.svelte'

    let economicEvents: EconomicEvent[] = [];
    allEconomicEvents.subscribe(value => {
        economicEvents = value;
    });

    let economicResources: EconomicResource[] = [];
    allEconomicResources.subscribe(value => {
        economicResources = value;
    });

    let fulfillments: Fulfillment[] = [];
    allFulfillments.subscribe(value => {
        fulfillments = value;
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

    let exportOpen = false;
    let importing = false;
    let modalOpen = false;

    onMount(async () => {
        await getAllEconomicEvents();
        await getAllEconomicResources();
        await getAllUnits();
        await getAllResourceSpecifications();
    });

    async function saveEconomicEvent(economicEvent: EconomicEventCreateParams) {
      console.log("economicEvent", economicEvent);
      let economicEventCreateInput: EconomicEventCreateParams = {
        action: economicEvent.action.label,
        provider: economicEvent.providerId,
        receiver: economicEvent.receiverId,
        resourceQuantity: { hasNumericalValue: economicEvent.resourceQuantity.hasNumericalValue, hasUnit: economicEvent.resourceQuantity.hasUnitId },
        resourceConformsTo: economicEvent.resourceConformsTo.id,
        hasPointInTime: new Date(),
        hasBeginning: new Date(),
      }

      let pickupFromOtherAgent = economicEvent.action.label == "pickup" && economicEvent.providerId != economicEvent.receiverId
      let produce = economicEvent.action.label == "produce"
      let consume = economicEvent.action.label == "consume"

      if (pickupFromOtherAgent || produce || consume) {
        let matchingResource = economicResources.find(it => it.conformsTo.id == economicEvent.resourceConformsTo.id)
        if (matchingResource) {
          economicEvent.resourceInventoriedAs = matchingResource.id
        }
      }

      if (!economicEvent?.resourceInventoriedAs && ( pickupFromOtherAgent || produce ) ) {
        console.log("add new economic event and resource", !economicEvent?.resourceInventoriedAs, event)
        let resourceSpecification = resourceSpecifications.find(it => it.id == economicEvent.resourceConformsTo.id)
        let newInventoriedResource: EconomicResourceCreateParams = {
          name: resourceSpecification?.name,
          image: resourceSpecification?.image,
          conformsTo: resourceSpecification?.id,
          trackingIdentifier: crypto.randomUUID(),
        }

        const res = await createEconomicEventWithResource(economicEventCreateInput, newInventoriedResource)

      } else {
        console.log("add economic event", economicEventCreateInput)
        const res = await createEconomicEvent(economicEventCreateInput)
        console.log("economic event res", res)
      }
      // console.log("economicEventCreateInput", economicEventCreateInput);
      // await createEconomicEvent(economicEventCreateInput);
      await getAllEconomicEvents();
      // modalOpen = false;
    }
</script>

<Header title="Economic events" description="The economic events in a network." />
    
<EconomicEventModal bind:open={modalOpen} agents={agents} resourceSpecifications={resourceSpecifications} units={units}
  on:submit={async (e) => {
    console.log("raw", e)
    saveEconomicEvent(e.detail.event);
  }}
/>

<div class="p-12">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
    </div>
    <!-- add economic event with modal -->
    <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
      <button
        type="button"
        on:click={() => {
          modalOpen = true;
        }}
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add an event</button>
    </div>
               
    <Export dataName="Economic Events" fileName="cfn-economic-events" data={{"economicEvents": economicEvents, "fulfillments": fulfillments}} bind:importing bind:open={exportOpen}
      on:import={async data => {
        console.log("importing", data.detail);
        await importEconomicEvents(data.detail);
        importing = false;
        exportOpen = false;
        await getAllEconomicEvents();
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
</div>
