<script lang="ts">
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import type { ComponentType } from 'svelte'
  import type { AgentConnection, Agent, Proposal, ProposalConnection, ProposedIntent } from '@leosprograms/vf-graphql'
  import ErrorPage from './__error.svelte'
  import Search from '$lib/Search.svelte'
  import SidePanel from '$lib/SidePanel.svelte'
  import type { AgentExtended } from '$lib/graphql/extension-schemas'
  import { getAllAgents, getAllProposals } from '../crud/fetch'
  import { allAgents, allProposals } from '../crud/store'
  import Loading from '$lib/Loading.svelte'
  let loading = false;
  let error: any;
  let agents: AgentExtended[];
  let matchedAgents: AgentExtended[];
  let offersList: Proposal[] = [];
  let roleImages = {
    "Farmer": "farm.svg",
    "Scouring Mill": "mill.svg",
    "Spinning Mill": "mill.svg",
    "Knitting Factory": "mill.svg",
    "Weaving Factory": "mill.svg",
    "Designer": "knitting.svg",
    "Shipping": "truck.svg",
  }


  let panelInfo: any,
      MapComponent: ComponentType

  allAgents.subscribe((res) => {
    agents = res.map((a) => {
      // @ts-ignore
      let iconUrl = roleImages[a.classifiedAs[2]] || a.image//'mill.svg'
      return {
        ...a,
        "name": a.name,
        "imageUrl": a.image,
        "iconUrl": a.classifiedAs[3] || a.image,
        "latLng": {lat: a.classifiedAs[0], lon: a.classifiedAs[1]},
        "address": a.note,
        "offers": offersList?.filter((o: Proposal) => (o.publishes || [])
          .filter((pi: ProposedIntent) => !pi.reciprocal && pi.publishes.provider?.id === a.id).length > 0)
      }
    })
  })

  allProposals.subscribe((res) => {
    offersList = res
  })

  onMount(async () => {
    loading = agents.length === 0
    await getAllProposals()
    await getAllAgents()
    loading = false
    // setInterval(function(){
    //   fetchAgents()
    // }, 20000)

    // defer Leaflet map load until rendering, and only in browser environment
    if (browser) {
      MapComponent = (await import('$lib/Map.svelte')).default
    }
  })

  $: agents, offersList;
</script>

<div class="relative h-full w-full">
  {#if agents}
    <!-- {JSON.stringify(agents[0].latlng)} -->
    {#if loading}
      <Loading />
      <!-- <svelte:component this={MapComponent} agents={[]} bind:panelInfo /> -->
    {:else if error}
      <ErrorPage status="Problem loading network Agents" error={error} />
    {:else if agents}
      <svelte:component this={MapComponent} agents={agents} bind:panelInfo />
      <Search bind:allData={agents} bind:matchedData={matchedAgents} bind:panelInfo/>
      {#if panelInfo }
        <SidePanel bind:panelInfo />
      {/if}
    {:else}
      <ErrorPage status="Problem loading network Agents" error={new Error("Failed to interpret response")} />
    {/if}
  {:else}
    <svelte:component this={MapComponent} agents={[]} bind:panelInfo />
  {/if}
</div>
