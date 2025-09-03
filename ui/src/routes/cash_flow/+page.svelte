<script lang="ts">
    import type { EconomicEventCreateParams, Agent, Fulfillment, EconomicResource, EconomicResourceCreateParams }  from '@valueflows/vf-graphql'
    import Header from "$lib/Header.svelte";
    import { onMount } from "svelte";
    import { getAllAgents, getAllEconomicEvents, getAllEconomicResources, getAllFacetGroups, getAllResourceSpecifications, getAllUnits, getAllActions, getAllProcessSpecifications } from "../../crud/fetch";
    import { importEconomicEvents } from '../../crud/import';
    import EconomicEventModal from '../economic_events/EconomicEventModal.svelte';
    import Export from '$lib/Export.svelte';
    import { createEconomicEvent, createEconomicEventWithResource } from '../../crud/commit'
    import { GET_ALL_ECONOMIC_EVENTS, GET_ALL_ECONOMIC_RESOURCES, GET_ALL_AGENTS } from '../../crud/fetch';
    import EconomicEvent from '$lib/icons/EconomicEvent.svelte'
    import Loading from '$lib/Loading.svelte';
    import SvgIcon from '$lib/SvgIcon.svelte';
    import { query } from 'svelte-apollo';

    const economicEventsQuery = query(GET_ALL_ECONOMIC_EVENTS);
    const economicResourcesQuery = query(GET_ALL_ECONOMIC_RESOURCES);
    const agentsQuery = query(GET_ALL_AGENTS);

    let economicResources: EconomicResource[] = [];
    economicResourcesQuery.subscribe(res => {
      console.log('economicResourcesQuery', res);
      economicResources = res?.data?.economicResources.edges.map(edge => edge.node) || [];
      console.log('economicResources', economicResources);
    });

    let exportOpen = false;
    let loading: boolean = false;
    let fetching: boolean = false;
    let importing = false;
    let modalOpen = false;
    let networkAgent: Agent | null = null;
    let cashFlowEvents: EconomicEvent[] = [];

    $: if ($agentsQuery.data) {
      const agents = $agentsQuery.data.agents.edges.map(edge => edge.node);
      networkAgent = agents.find(agent => agent.classifiedAs[2] === "Network") || null;
      console.log("networkAgent", networkAgent);
    }

    $: if ($economicEventsQuery.data) {
      cashFlowEvents = $economicEventsQuery.data.economicEvents.edges.map(edge => edge.node).reverse()
        .filter(economicEvent => economicEvent?.resourceConformsTo?.name == "USD" &&
          (economicEvent?.receiver?.id == networkAgent?.id || economicEvent?.provider?.id == networkAgent?.id)
        );
      console.log("cashFlowEvents", cashFlowEvents);
    }

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
      agentsQuery.refetch();
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

      console.log("resourceConformsTo", economicEvent.resourceConformsTo.id, pickupFromOtherAgent, produce, consume);
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
      await economicEventsQuery.refetch();
      await economicResourcesQuery.refetch();
    }

    function calculateBalance(economicEvents: EconomicEvent[]) {
      let balance = 0;
      economicEvents.forEach(event => {
        if (event.resourceQuantity?.hasNumericalValue) {
          if (event.receiver?.id == networkAgent?.id) {
            balance += event.resourceQuantity.hasNumericalValue;
          } else if (event.provider?.id == networkAgent?.id) {
            balance -= event.resourceQuantity.hasNumericalValue;
          }
        }
      });
      return balance;
    }
</script>

<Header title="Cash Flow" description="The flow of cash in a network." />
    
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
    <!-- <div class="mt-4 sm:ml-3 sm:mt-0 sm:flex-none">
      <button
        type="button"
        on:click={() => {
          modalOpen = true;
        }}
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add an event</button>
    </div> -->
               
    <Export 
      dataName="Cash Flow" 
      fileName="cfn-cash-flow"
      dataType="csv"
      data={
          cashFlowEvents.map((economicEvent, index) => ({
            agent: economicEvent.receiver?.id == networkAgent.id ? economicEvent.provider?.name : economicEvent.receiver?.name,
            date: new Date(economicEvent.hasBeginning).toLocaleDateString(),
            amount: (economicEvent.resourceQuantity?.hasNumericalValue || 0) * (economicEvent.receiver?.id == networkAgent.id ? 1 : -1),
            note: economicEvent?.note || "-",
            balance: calculateBalance(cashFlowEvents.slice(index, cashFlowEvents.length + 1)),
          }))
        } 
      bind:importing 
      bind:open={exportOpen} 
      hideImport={true}
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
                >Agent</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Date</th
                >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Amount</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Note</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Balance</th
              >
              <!-- <th 
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Corrections
              </th> -->
            </tr>
          </thead>
          <tbody class="bg-white">
            {#if $economicEventsQuery.loading}
              <span>Loading...</span>
            {:else}
              {#each cashFlowEvents as economicEvent, index}
                {@const direction = economicEvent.receiver?.id == networkAgent?.id ? "in" : "out"}
                {@const eventsUpTillNow = cashFlowEvents.slice(index, cashFlowEvents.length + 1)}
                {@const balance = calculateBalance(eventsUpTillNow)}
                <tr class="{index % 2 == 0 ? 'bg-gray-100': ''}">
                  <td class="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {direction == "in" ? economicEvent.provider?.name : economicEvent.receiver?.name}
                  </td>
                  <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(economicEvent?.hasBeginning).toLocaleDateString()}
                  </td>
                  <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {direction == "in" ? "+" : "-"}
                    {economicEvent.resourceQuantity?.hasNumericalValue} 
                  </td>
                  <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {economicEvent?.note || "-"} 
                  </td>
                  <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {balance}
                  </td>
                  <!-- <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {#if economicEvent?.correctedBy?.length > 0}
                      {economicEvent.correctedBy.length}
                    {:else}
                      0
                    {/if}
                    <button
                      type="button"
                      on:click={() => {
                        modalOpen = true;
                        console.log("open modal for", economicEvent);
                      }}
                      class="text-indigo-600 hover:text-indigo-900"
                    >
                      <SvgIcon icon="event" size=14 color="#6b7280" />
                    </button>
                  </td> -->
                </tr>
              {/each}
            {/if}
            </tbody>
        </table>
        </div>
    </div>
</div>
</div>
