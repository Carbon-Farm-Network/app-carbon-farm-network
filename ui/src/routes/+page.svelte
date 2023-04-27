<script lang="ts">
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import type { ComponentType } from 'svelte'
  import { setClient, query } from 'svelte-apollo'
  import type { ReadableQuery } from 'svelte-apollo'
  import { gql } from 'graphql-tag'
  import autoConnect from '@vf-ui/graphql-client-holochain'
  import type { AgentConnection, Agent } from '@valueflows/vf-graphql'
  import type { ApolloClient, NormalizedCacheObject } from '@apollo/client'

  import Error from './__error.svelte'
  import Search from '$lib/Search.svelte'
  import SidePanel from '$lib/SidePanel.svelte'

  import { flattenRelayConnection } from '$lib/graphql/helpers'
  import type { RelayConn } from '$lib/graphql/helpers'
  import { AGENT_CORE_FIELDS } from '$lib/graphql/agent.fragments'

  // query & data bindings

  const GET_ALL_AGENTS = gql`
    ${AGENT_CORE_FIELDS}
    query {
      agents(last: 100000) {
        edges {
          cursor
          node {
            ...AgentCoreFields
          }
        }
      }
    }
  `

  interface QueryResponse {
    agents: AgentConnection & RelayConn<Agent>
  }

  // init and manage GraphQL client connection

  let client: ApolloClient<NormalizedCacheObject> | null = null
  let loading = true
  let error = null

  async function initConnection() {
    try {
      // :NOTE: conductor URI need not be set when running via Tauri window
      client = await autoConnect()
    } catch (e) {
      error = e
    }
    loading = false
    error = null
  }

  initConnection()

  // map component state

  let panelInfo: any,
      MapComponent: ComponentType,
      agentsQuery: ReadableQuery<QueryResponse>,
      agents: Agent[]

  onMount(async () => {
    // defer Leaflet map load until rendering, and only in browser environment
    if (browser) {
      MapComponent = (await import('$lib/Map.svelte')).default
    }
  })

  // reactive data bindings

  $: {
    // set client context & init query when connection has inited
    if (client) {
      setClient(client)
      agentsQuery = query(GET_ALL_AGENTS)
    }

    // assign derived values from Agent list API
    if ($agentsQuery.data) {
      agents = flattenRelayConnection($agentsQuery.data?.agents)
    }
  }
</script>

{#if browser && agents !== undefined}
  <div class="relative h-full w-full">
    {#if $agentsQuery.loading}
      <svelte:component this={MapComponent} agents={[]} bind:panelInfo />
    {:else if $agentsQuery.error}
      <Error status="Problem loading network Agents" error={$agentsQuery.error} />
    {:else}
      <svelte:component this={MapComponent} agents={agents} bind:panelInfo />
      <Search bind:allData={agents} bind:displayData={agents} />
      {#if panelInfo }
        <SidePanel bind:panelInfo />
      {/if}
    {/if}
  </div>
{/if}
