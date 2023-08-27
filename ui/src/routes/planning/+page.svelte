<script lang="ts">
  import plan from '$lib/data/plan.json'
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
    {#each [{ title: 'Pick up and combine', image_src: '/Farmer_and_Sheep.jpeg', box_color: 'bg-yellow-200' }, { title: 'Scour', image_src: '/mill.svg', box_color: 'bg-green-200' }, { title: 'Scour', image_src: '/mill.svg', box_color: 'bg-green-200' }, { title: 'Scour', image_src: '/mill.svg', box_color: 'bg-green-200' }, { title: 'Scour', image_src: '/mill.svg', box_color: 'bg-green-200' }] as { title, image_src, box_color }}
      <div class="min-w-[300px]">
        <img class="mx-auto" height="80px" width="80px" src={image_src} />
        <h2 class="text-center">{title}</h2>
        <div class="bg-gray-400 border border-gray-400 p-2">
          <!-- Sub-columns -->
          <div class="grid grid-cols-2 gap-2">
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
            <div class="{box_color} rounded-r-full border border-gray-400 p-2">Box 2</div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
