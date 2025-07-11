<script lang="ts">
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import type { ComponentType } from 'svelte'
  import type { AgentConnection, Agent, Proposal, ProposalConnection } from '@valueflows/vf-graphql'
  import ErrorPage from './__error.svelte'
  import Search from '$lib/Search.svelte'
  import SidePanel from '$lib/SidePanel.svelte'
  import { GET_ALL_AGENTS, GET_All_PROPOSALS } from '../crud/fetch'
  import { query } from 'svelte-apollo'
  // import { allAgents, allProposals } from '../crud/store'
  import Loading from '$lib/Loading.svelte'

  const agentsQuery = query(GET_ALL_AGENTS);
  const proposalsQuery = query(GET_All_PROPOSALS);

  let loading = false;
  let error: any;
  let agents: any[];
  let matchedAgents: any[];
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

  agentsQuery.subscribe((res) => {
    agents = res.data?.agents?.edges.map((edge: AgentConnection) => {
      const a = edge.node as Agent;
      // @ts-ignore
      let iconUrl = roleImages[a.classifiedAs[2]] || a.image//'mill.svg'
      return {
        ...a,
        "name": a.name,
        "imageUrl": a.image,
        "iconUrl": iconUrl,
        "latLng": {lat: JSON.parse(a.classifiedAs[0]), lon: JSON.parse(a.classifiedAs[1])},
        "address": a.note,
        // "offers": offersList?.filter((o: Proposal) => !o.reciprocal && o.provider?.id === a.id).length > 0
      }
    }) || [];
    loading = agentsQuery.loading
  })

  proposalsQuery.subscribe((res) => {
    offersList = res.data?.proposals?.edges.map((edge: ProposalConnection) => edge.node as Proposal) || [];
    agents = agents.map((a) => {
      return {
        ...a,
        "offers": offersList?.filter((o: Proposal) => o.publishes[0]?.provider?.id === a.id)
      }
    })
  })

  // allAgents.subscribe((res) => {
  //   agents = res.map((a) => {
  //     // @ts-ignore
  //     let iconUrl = roleImages[a.classifiedAs[2]] || a.image//'mill.svg'
  //     console.log("offers list", 
  //       offersList.filter((o: Proposal) => {
  //         return true
  //       })
  //     )
  //     return {
  //       ...a,
  //       "name": a.name,
  //       "imageUrl": a.image,
  //       "iconUrl": a.classifiedAs[3] || a.image,
  //       "latLng": {lat: JSON.parse(a.classifiedAs[0]), lon: JSON.parse(a.classifiedAs[1])},
  //       "address": a.note,
  //       "offers": offersList?.filter((o: Proposal) => !o.reciprocal && o.provider?.id === a.id).length > 0
  //     }
  //   })
  // })



  // allProposals.subscribe((res) => {
  //   offersList = res
  // })

  onMount(async () => {
    loading = agents.length === 0
    // await getAllResourceSpecifications()
    // await getAllProposals()
    // await getAllAgents()
    agentsQuery.refetch()
    proposalsQuery.refetch()
    // console.log("agents", agents)
    // getAllProposals()
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
