<script lang="ts">
  import plan from '$lib/data/plan-no-ship.json'
  import offers from '$lib/data/offers.json'
  import requests from '$lib/data/requests.json'
  import Header from '$lib/Header.svelte'
</script>

<div style="height: 8vh">
  <Header title="Planning" description="This page is for demonstration purposes only" />
</div>
<!--
<div class="bg-white px-6 py-8">
  <div class="mx-auto max-w-2xl text-left">
    <h2 class="text-2xl font-bold tracking-tight text-gray-900">Plan: {plan.name}</h2>
  </div>
</div>
-->

<div class="pt-4 flex justify-center items-center">
  <div class="flex space-x-4 mx-4 overflow-x-scroll">
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
  </div>
</div>
