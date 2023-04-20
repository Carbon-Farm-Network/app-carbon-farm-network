<script lang="ts">
  import { onMount } from 'svelte';
  import initGraphQLClient from '@vf-ui/graphql-client-holochain';
  import { setClient } from "svelte-apollo";
  import '@material/mwc-circular-progress';

  import Search from './acfn/rea_map/Search.svelte'
  import SidePanel from './acfn/rea_map/SidePanel.svelte'
  import allAgents from './data/agents.json'
  import Map from './acfn/rea_map/Map.svelte'

  let loading = true;
  let error: Error | undefined

  $: loading, error;

  // init hREA GraphQL API connection
  onMount(async () => {
    try {
      // :NOTE: no parameters will autoconnect in privileged Holochain UI environments
      setClient(await initGraphQLClient())
    } catch (e) {
      error = e as Error
    }
    loading = false;
  });

  let agents = allAgents;
  console.log(agents)
  let displayAgents = [...agents]
  let panelInfo: any
</script>

<main>
  {#if loading}
    <div style="display: flex; flex: 1; align-items: center; justify-content: center">
      <mwc-circular-progress indeterminate />
    </div>
  {:else}
    <div id="content" style="display: flex; flex-direction: column; flex: 1;">
      <div class="relative h-full w-full">
        <svelte:component this={Map} agents={displayAgents} bind:panelInfo />
        <Search bind:allData={agents} bind:displayData={displayAgents} />
        {#if panelInfo }
          <SidePanel bind:panelInfo />
        {/if}
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
