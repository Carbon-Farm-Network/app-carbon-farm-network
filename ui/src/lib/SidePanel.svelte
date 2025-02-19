<script lang="ts">
  import dayjs from "dayjs";
  import type { AgentExtended } from '$lib/graphql/extension-schemas'
  export let panelInfo: AgentExtended | undefined
  let dropdownOpen = false

  import offers from '$lib/data/offers.json'
  import agent_facet_values from '$lib/data/agent_facet_values.json'

  // assign to allFacets a unique array of facets listed in each facet value in panelInfo
  let allFacets = panelInfo ? [...new Set(panelInfo.facets.map(facet => facet.facet?.name))] : [];

  $: console.info('Panel displaying:', panelInfo)
</script>

<!-- Background overlay, show/hide based on slide-over state. -->
<div
  style="z-index: 100000"
  class="fixed inset-y-0 right-0 ml-10 max-w-full flex sm:ml-16"
>
  <!--
        Slide-over panel, show/hide based on slide-over state.

        Entering: "transform transition ease-in-out duration-500 sm:duration-700"
          From: "translate-x-full"
          To: "translate-x-0"
        Leaving: "transform transition ease-in-out duration-500 sm:duration-700"
          From: "translate-x-0"
          To: "translate-x-full"
      -->
  <div class="w-screen max-w-md">
    <div class="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
      <div class="px-4 py-6 sm:px-6">
        <div class="flex items-start justify-between">
          <h2 id="slide-over-heading" class="text-lg font-medium text-gray-900">
            {panelInfo && panelInfo.name}
          </h2>
          <div class="ml-3 h-7 flex items-center">
            <button
              type="button"
              class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500"
              on:click={() => (panelInfo = undefined)}
            >
              <span class="sr-only">Close panel</span>
              <!-- Heroicon name: outline/x -->
              <svg
                class="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <!-- Main -->
      <div>
        <div class="pb-1 sm:pb-6">
          <div>
            <div class="flex">
              <!--
               <img
                 class="ml-8 h-10"
                 src="https://cdn.shopify.com/s/files/1/0562/3434/4626/files/mini-mills-logo_1204x630.png?v=1619021372"
                 alt=""
               />
              -->
              <div class="ml-8">
                {#if panelInfo && panelInfo.imageUrl}
                  <img class="w-20" src={panelInfo.imageUrl} alt="" />
                {:else}
                  <span
                    class="inline-block h-14 w-14 rounded-full overflow-hidden bg-gray-100"
                  >
                    <svg
                      class="h-full w-full text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </span>
                {/if}
              </div>
              {#if panelInfo && panelInfo.address}
              <div class="mx-8">
                <p>{panelInfo && panelInfo.address}</p>
              </div>
              {/if}
            </div>
            {#if false}
            <div class="mt-6 px-4 sm:mt-8 sm:flex sm:items-end sm:px-6">
              <div class="sm:flex-1">
                <div class="mt-5 flex flex-wrap space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    class="flex-shrink-0 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:flex-1"
                  >
                    Message
                  </button>
                  <button
                    type="button"
                    class="flex-1 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Call
                  </button>
                  <span class="ml-3 inline-flex sm:ml-0">
                    <div class="relative inline-block text-left">
                      <button
                        type="button"
                        class="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        id="options-menu-button"
                        aria-expanded="false"
                        aria-haspopup="true"
                        on:click={() => (dropdownOpen = !dropdownOpen)}
                      >
                        <span class="sr-only">Open options menu</span>
                        <!-- Heroicon name: solid/dots-vertical -->
                        <svg
                          class="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
                          />
                        </svg>
                      </button>

                      <!--
			                              Dropdown panel, show/hide based on dropdown state.

			                              Entering: "transition ease-out duration-100"
			                                From: "transform opacity-0 scale-95"
			                                To: "transform opacity-100 scale-100"
			                              Leaving: "transition ease-in duration-75"
			                                From: "transform opacity-100 scale-100"
			                                To: "transform opacity-0 scale-95"
			                            -->
                      <div
                        class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                        class:hidden={!dropdownOpen}
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="options-menu-button"
                        tabindex="-1"
                      >
                        <div class="py-1" role="none">
                          <!-- Active: "bg-gray-100 text-gray-900", Not Active: "text-gray-700" -->
                          <a
                            href="#"
                            class="text-gray-700 block px-4 py-2 text-sm"
                            role="menuitem"
                            tabindex="-1"
                            id="options-menu-item-0">View profile</a
                          >
                          <a
                            href="#"
                            class="text-gray-700 block px-4 py-2 text-sm"
                            role="menuitem"
                            tabindex="-1"
                            id="options-menu-item-1">Copy profile link</a
                          >
                        </div>
                      </div>
                    </div>
                  </span>
                </div>
              </div>
            </div>
            {/if}
          </div>
        </div>
        <div class="px-4 pt-5 pb-5 sm:px-0 sm:pt-0">
          <div class="ml-8 my-4 mr-12">
            <ul role="list" class="">
              {#each allFacets as facetOption}
              {@const facet = panelInfo?.facets.findLast(facet => facet.facet?.name === facetOption)}
              <li class="flex items-center justify-between gap-x-6 py-1">
                <div class="min-w-0">
                  <div class="flex items-start gap-x-3">
                    <p class="text-sm font-semibold leading-6 text-gray-900">{facet?.facet?.name}</p>
                  </div>
                </div>
                <div class="flex flex-none items-center gap-x-4">
                  <p class="text-sm leading-6 text-gray-900">{facet?.value}</p>
                </div>
             </li>
             {/each}
            </ul>
          </div>
          {#if panelInfo?.offers}
          <p class="ml-8 mt-12">Offering:</p>
          <div class="mx-8">
            <ul role="list" class="divide-y divide-gray-200">
              <!-- Remember to replace with something coming from panel info -->
              <!-- {JSON.stringify(panelInfo.offers[0])} -->
              {#each panelInfo.offers as offer}
              {#if !offer.hasEnd || (new Date() < offer.hasEnd)}
                {@const mainIntent = (offer.publishes || []).find(it => !it.reciprocal)}
                {@const reciprocalIntent = (offer.publishes || []).find(it => it.reciprocal)}
                {@const availableOn = dayjs(offer.hasBeginning).format("YYYY MMM DD")}
                {#if mainIntent?.publishes?.availableQuantity?.hasNumericalValue > 0}
                <li class="flex items-center justify-between gap-x-6 py-2">
                  <div class="min-w-0">
                    <div class="flex items-start gap-x-3">
                      <p class="text-sm font-semibold leading-6 text-gray-900">{mainIntent?.publishes?.resourceConformsTo?.name}</p>
                    </div>
                    <div class="flex items-start gap-x-3">
                      <p class="text-sm leading-6 text-gray-500">Price: {reciprocalIntent?.publishes?.resourceQuantity?.hasNumericalValue} {reciprocalIntent?.publishes?.resourceConformsTo?.name} per {mainIntent?.publishes?.resourceQuantity?.hasNumericalValue} {mainIntent?.publishes?.availableQuantity?.hasUnit?.label}</p>
                    </div>
                    <div class="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                      <!-- {JSON.stringify(mainIntent.publishes?.availableQuantity.hasNumericalValue)} -->
                      <!-- {JSON.stringify(mainIntent.publishes?.availableQuantity.hasUnit.label)} -->
                      <!-- {JSON.stringify(offer)} -->
                      <p class="whitespace-nowrap">Available {mainIntent?.publishes?.availableQuantity?.hasNumericalValue} {mainIntent?.publishes?.availableQuantity?.hasUnit?.label} on <time datetime={offer.hasBeginning}>{availableOn}</time></p>
                    </div>
                    <div class="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                      {#each (mainIntent?.publishes?.resourceConformsTo?.facets || []) as facet}
                        <div class="display:block;">{facet.facet.name}: {facet.value}</div>
                      {/each}
                    </div>
                  </div>
                </li>
              {/if}
              {/if}
              {/each}

              <!-- More items... -->
            </ul>
          </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
