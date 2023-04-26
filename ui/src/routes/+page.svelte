<script lang="ts">
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import Search from '$lib/Search.svelte'
  import SidePanel from '$lib/SidePanel.svelte'
  import allAgents from '$lib/data/agents.json'

  import bindSchema, { autoConnect } from '@valueflows/vf-graphql-holochain'
  import { gql } from 'graphql-tag'


  let MapComponent
  onMount(async () => {
    if (browser) {
      MapComponent = (await import('$lib/Map.svelte')).default
    }

    const {dnaConfig} = await autoConnect('ws://localhost:4000', 'hrea_suite');
    const schema = await bindSchema({ conductorUri: 'ws://localhost:4000', dnaConfig });
    
    // console.log(dnaConfig, "dna");
    // console.log(conductorUri, "conductor");

    // const query = gql`
    //   query myAgent {
    //     id
    //     name
    //   }`

    // const response = await fetch('ws://localhost:4000', {
    //    method: 'POST',
    //    headers: {
    //      'Content-Type': 'application/json',
    //    },
    //    body: JSON.stringify({
    //      query,
    //    })
    //  });

    //  const data = await response.json();
    //  console.log(data);
  })

  let agents = allAgents;
  console.log(agents)
  let displayAgents = [...agents]
  let panelInfo: any
</script>

{#if browser}
  <div class="relative h-full w-full">
    <svelte:component this={MapComponent} agents={displayAgents} bind:panelInfo />
	  <Search bind:allData={agents} bind:displayData={displayAgents} />
    {#if panelInfo }
      <SidePanel bind:panelInfo />
    {/if}
  </div>
{/if}

