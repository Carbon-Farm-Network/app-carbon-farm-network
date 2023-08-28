<script lang="ts">
  import plan from '$lib/data/plan-no-ship.json'
  import offers from '$lib/data/offers.json'
  import requests from '$lib/data/requests.json'
  import Header from '$lib/Header.svelte'
</script>

<!-- custom header introduced to enable planning to be more inline with the beginning of the page -->
<div class="custom-background" style="height: 8vh">
  <div class="mx-auto px-2 sm:px-6 lg:px-8">
    <h2 class="pt-1 text-white text-2xl">Planning</h2>
    <p class="text-white text-xs">This page is for demonstration purposes only</p>
  </div>
</div>

<div class="pt-4 flex justify-center items-center">
  <div class="flex space-x-8 mx-4 overflow-x-scroll">
    <div class="min-w-[200px] mt-20">
      <h2 class="text-center">Offers</h2>
      <div class="bg-blue-300 border border-gray-400 p-2">
        <!-- Sub-columns -->
        <div class="">
          <div>
            {#each offers as { proposed_intents }}
              {@const reciprocal = proposed_intents.find(it => it.reciprocal)}
              {@const primary = proposed_intents.find(it => !it.reciprocal)}
              <div
                class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
              >
                <p>{primary?.intent?.resource_conforms_to?.name}</p>
                {#if primary?.intent?.available_quantity}
                  <p>
                    {primary?.intent?.available_quantity?.has_numerical_value}
                    {primary?.intent?.available_quantity?.has_unit?.label},
                    {reciprocal?.intent?.resource_quantity?.has_numerical_value}
                    USD per lb
                  </p>
                {:else}
                  <p>
                    {reciprocal?.intent?.resource_quantity?.has_numerical_value}
                    USD per lb
                  </p>
                {/if}
                <p>{primary?.intent?.provider?.name}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!--
    <div>
      <h2 class="text-center">Offers</h2>
      <div class="bg-blue-300 border border-gray-400 p-2">
        <div
          class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
        >
          <p>Brown Alpaca Dirty</p>
          <div class="flex justify-between">
            <p>20 lbs</p>
            <p>20 lbs</p>
          </div>
          <p>WoodLand Meadow</p>
        </div>
      </div>
    </div>
    -->
    <!-- Main Columns -->
    {#each plan.process_specifications as { name, image, processes }}
      <div class="min-w-[400px]">
        <img class="mx-auto" height="80px" width="80px" src={image} />
        <h2 class="text-center">{name}</h2>
        {#each processes as { inputs, outputs }}
          <div class="bg-gray-400 border border-gray-400 p-2">
            <!-- Sub-columns -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                {#each inputs as { resource_conforms_to, supply_driven_quantity, demand_driven_quantity, provider }}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                  >
                    <p>{resource_conforms_to.name}</p>
                    <div class="flex justify-between">
                      <p>
                        {supply_driven_quantity.has_numerical_value}
                        {supply_driven_quantity.has_unit?.label}
                      </p>
                      <p>
                        {demand_driven_quantity.has_numerical_value}
                        {demand_driven_quantity.has_unit?.label}
                      </p>
                    </div>
                    <p>{provider.name}</p>
                  </div>
                {/each}
              </div>
              <div>
                {#each outputs as { resource_conforms_to, supply_driven_quantity, demand_driven_quantity, receiver, provider }}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                  >
                    <p>{resource_conforms_to.name}</p>
                    <div class="flex justify-between">
                      <p>
                        {supply_driven_quantity.has_numerical_value}
                        {supply_driven_quantity.has_unit?.label}
                      </p>
                      <p>
                        {demand_driven_quantity.has_numerical_value}
                        {demand_driven_quantity.has_unit?.label}
                      </p>
                    </div>
                    <p>{(receiver || provider)?.name}</p>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/each}

    <div class="min-w-[200px] mt-20">
      <h2 class="text-center">Requests</h2>
      <div class="bg-blue-300 border border-gray-400 p-2">
        <!-- Sub-columns -->
        <div class="">
          <div>
            {#each requests as { proposed_intents }}
              {@const reciprocal = proposed_intents.find(it => it.reciprocal)}
              {@const primary = proposed_intents.find(it => !it.reciprocal)}
              <div
                class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
              >
                <p>{primary?.intent?.resource_conforms_to?.name}</p>
                <p>
                  {primary?.intent?.resource_quantity?.has_numerical_value}
                  {primary?.intent?.resource_quantity?.has_unit?.label}
                </p>
                <p>{primary?.intent?.receiver?.name}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom CSS */
  .custom-background {
    background-image: url('/heading3.png');
    background-size: cover;
    background-position: center;
  }
</style>
