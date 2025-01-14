<script lang="ts">
  import { onMount } from 'svelte';
  import { LeafletMap, TileLayer, Icon, Marker, Popup } from 'svelte-leafletjs'
  import 'leaflet/dist/leaflet.css'

  import type { AgentExtended } from '$lib/graphql/extension-schemas'

  export let agents: AgentExtended[]
  export let panelInfo: AgentExtended | undefined;
  let mounted = false;
  let leafletMap;

  $: mounted;

  const mapOptions = {
    // LatLngExpression: [41.083, -74.042],
    center: [41.083, -74.042] as [number, number],
    zoom: 5
  }

  onMount(() => {
    mounted = true;
  })

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const tileLayerOptions = {
    minZoom: 0,
    maxZoom: 20,
    maxNativeZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }

  const defaultIconOptions = {
    iconSize: [31, 31],
    // iconAnchor: [20, 41],
    // popupAnchor: [1, -34],
    // tooltipAnchor: [16 - 28]
  }
</script>


{#if mounted}
<!-- This example requires Tailwind CSS v2.0+ -->
<LeafletMap bind:this={leafletMap} options={mapOptions}>
  <TileLayer url={tileUrl} options={tileLayerOptions} />
  {#each agents as agent}
    <Marker
      latLng={agent.latLng}
      events={['click']}
      on:click={() => {
        panelInfo = agent
      }}
    >
      {#if agent.iconUrl }
        <Icon options={{iconUrl: agent.iconUrl, ...defaultIconOptions}} />
        <!-- <img class="h-20 w-20" src={agent.iconUrl} alt="" /> -->

      {/if}
      {#if agent.popup }
      <Popup><b>{agent.popup}</b></Popup>
      {/if}
    </Marker>
  {/each}
</LeafletMap>
{/if}