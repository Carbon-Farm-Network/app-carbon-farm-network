<script lang="ts">
    import type { EconomicEventCreateParams, Agent, Fulfillment, EconomicResource, EconomicResourceCreateParams }  from '@valueflows/vf-graphql'
    import Header from "$lib/Header.svelte";
    import { onMount } from "svelte";
    import { getAllAgents, getAllEconomicEvents, getAllEconomicResources, getAllFacetGroups, getAllResourceSpecifications, getAllUnits, getAllActions, getAllProcessSpecifications } from "../../crud/fetch";
    import { importEconomicEvents } from '../../crud/import';
    import EconomicEventModal from './EconomicEventModal.svelte';
    import Export from '$lib/Export.svelte';
    import { createEconomicEvent, createEconomicEventWithResource } from '../../crud/commit'
    import { GET_ECONOMIC_EVENTS, GET_ALL_ECONOMIC_RESOURCES } from '../../crud/fetch';
    import EconomicEvent from '$lib/icons/EconomicEvent.svelte'
    import Loading from '$lib/Loading.svelte';
    import SvgIcon from '$lib/SvgIcon.svelte';
    import { query } from 'svelte-apollo';

    const economicEventsQuery = query(GET_ECONOMIC_EVENTS);
    const economicResourcesQuery = query(GET_ALL_ECONOMIC_RESOURCES);

    let economicResources: EconomicResource[] = [];
    economicResourcesQuery.subscribe(res => {
      economicResources = res?.data?.economicResources.edges.map(edge => edge.node) || [];
      console.log('economicResources', economicResources);
    });

    let exportOpen = false;
    let loading: boolean = false;
    let fetching: boolean = false;
    let importing = false;
    let modalOpen = false;

    async function refresh() {
      fetching = true;
      console.log("Economic events refetched", $economicEventsQuery.data);
      economicEventsQuery.refetch();
      economicResourcesQuery.refetch();
      fetching = false;
    }

    onMount(async () => {
      loading = $economicEventsQuery.loading;
      economicEventsQuery.refetch();
      economicResourcesQuery.refetch();
      // loading = economicEvents.length === 0 || units.length === 0 || resourceSpecifications.length === 0;
      // console.log(economicEvents.length, units.length, resourceSpecifications.length)
      
      // await getAllUnits();
      // await getAllActions();
      // await getAllFacetGroups();
      // await getAllAgents();
      // const rspecs = await getAllResourceSpecifications();
      // console.log("resourceSpecifications", rspecs)
      // const ecrecs = await getAllEconomicResources();
      // console.log("economicResources", ecrecs)
      // await new Promise(resolve => setTimeout(resolve, 1000));
      // const ecevs = await getAllEconomicEvents();
      // console.log("economicEvents", ecrecs, ecevs)
      loading = false;
    });

    async function saveEconomicEvent(economicEvent: EconomicEventCreateParams) {
      console.log("economicEvent", economicEvent);
      let economicEventCreateInput: EconomicEventCreateParams = {
        action: economicEvent.action.label,
        provider: economicEvent.provider?.id || economicEvent.providerId,
        receiver: economicEvent.receiver?.id || economicEvent.receiverId,
        resourceQuantity: { 
          hasNumericalValue: economicEvent.resourceQuantity.hasNumericalValue, 
          hasUnit: economicEvent.resourceQuantity.hasUnit?.id || economicEvent.resourceQuantity.hasUnitId
        },
        resourceConformsTo: economicEvent.resourceConformsTo.id,
        hasPointInTime: new Date(),
        hasBeginning: new Date(),
      }

      let pickupFromOtherAgent = economicEvent.action.label == "pickup" && (economicEvent.provider?.id != economicEvent.receiver?.id || economicEvent.providerId != economicEvent.receiverId);
      let produce = economicEvent.action.label == "produce"
      let consume = economicEvent.action.label == "consume"

      console.log(economicEventCreateInput, pickupFromOtherAgent, produce, consume, economicResources)

      console.log("resourceConformsTo", economicEvent.resourceConformsTo.id)
      if (pickupFromOtherAgent || produce || consume) {
        let matchingResource = economicResources.find(it => it.conformsTo?.id == economicEvent.resourceConformsTo.id)
        console.log("matching resource", matchingResource)
        if (matchingResource) {
          economicEventCreateInput.resourceInventoriedAs = matchingResource.id
        }
      }

      console.log("inventoried as", economicEvent.resourceInventoriedAs)

      if (!economicEventCreateInput?.resourceInventoriedAs && ( pickupFromOtherAgent || produce ) ) {
        console.log("add new economic event and resource", !economicEvent?.resourceInventoriedAs, event)
        let resourceSpecification = economicEvent.resourceConformsTo
        let newInventoriedResource: EconomicResourceCreateParams = {
          name: resourceSpecification?.name,
          image: resourceSpecification?.image,
          conformsTo: resourceSpecification?.id,
          trackingIdentifier: null,//crypto.randomUUID(),
        }

        const res = await createEconomicEventWithResource(economicEventCreateInput, newInventoriedResource)

      } else {
        console.log("add economic event", economicEventCreateInput)
        const res = await createEconomicEvent(economicEventCreateInput)
        console.log("economic event res", res)
      }
      // console.log("economicEventCreateInput", economicEventCreateInput);
      // await createEconomicEvent(economicEventCreateInput);
      // await getAllEconomicEvents();
      await economicEventsQuery.refetch();
      await economicResourcesQuery.refetch();
      // modalOpen = false;
    }
</script>

<Header title="Economic events" description="The economic events in a network." />
    
<EconomicEventModal bind:open={modalOpen}
  on:submit={async (e) => {
    console.log("raw", e)
    saveEconomicEvent(e.detail.event);
  }}
/>

{#if loading}
  <Loading />
{/if}

<div class="p-12">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
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
      
    <!-- add economic event with modal -->
    <div class="mt-4 sm:ml-3 sm:mt-0 sm:flex-none">
      <button
        type="button"
        on:click={() => {
          modalOpen = true;
        }}
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add an event</button>
    </div>
               
    <!-- <Export dataName="Economic Events" fileName="cfn-economic-events" data={{"economicEvents": economicEvents, "fulfillments": fulfillments}} bind:importing bind:open={exportOpen}
      on:import={async data => {
        console.log("importing", data.detail);
        await importEconomicEvents(data.detail);
        importing = false;
        exportOpen = false;
        await getAllEconomicEvents();
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
              <!-- <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit</span>
              </th> -->
            </tr>
          </thead>
          <tbody class="bg-white">
            {#if $economicEventsQuery.loading}
              <span>Loading...</span>
            {:else}
              {@const economicEvents = $economicEventsQuery.data?.economicEvents.edges.map((edge) => edge.node).reverse() ?? []}
              {#each economicEvents as economicEvent, index}
                <tr class="{index % 2 == 0 ? 'bg-gray-100': ''}">
                  <td class="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {economicEvent.provider?.name}
                  </td>
                  <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {economicEvent.receiver?.name}
                  </td>
                  <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {economicEvent.action?.label}
                  </td>
                  <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {economicEvent.resourceQuantity?.hasNumericalValue} 
                      {economicEvent.resourceQuantity?.hasUnit?.label}
                      {economicEvent?.resourceConformsTo?.name}
                  </td>
                  <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(economicEvent?.hasBeginning).toLocaleDateString()}
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
