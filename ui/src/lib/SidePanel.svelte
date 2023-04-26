<script lang="ts">
  import type { Agent } from 'globals'
  export let panelInfo: Agent | undefined
  let dropdownOpen = false
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
                  <img
                    class="h-20 w-40"
                    src="{panelInfo.imageUrl}"
                    alt=""
                  />
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
              <div class="mx-8">
                <p>{panelInfo && panelInfo.address}</p>
              </div>
            </div>
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
          </div>
        </div>
        <div class="px-4 pt-5 pb-5 sm:px-0 sm:pt-0">
          <p class="ml-8">Offering:</p>
          <div class="mx-8">
            <ul role="list" class="divide-y divide-gray-200">
              {#each panelInfo.offers as { name, availableDate, price, priceUnit, quantity, quantityUnit }}
                <li class="py-4">
                  <div class="flex space-x-3">
                    <img
                      class="h-6 w-6 rounded-full"
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=256&h=256&q=80"
                      alt=""
                    />
                    <div class="flex-1 space-y-1">
                      <div class="flex items-center justify-between">
                        <h3 class="text-sm font-medium">{name}</h3>
                        <p class="text-sm text-gray-500">From: {availableDate}</p>
                      </div>
                      <p class="text-sm text-gray-500">
                        {quantity}
                        {quantityUnit} @ {price}
                        {priceUnit}
                      </p>
                    </div>
                  </div>
                </li>
              {/each}

              <!-- More items... -->
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
