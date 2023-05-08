<script lang="ts">
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import type { ComponentType } from 'svelte'
  import { query } from 'svelte-apollo'
  import type { ReadableQuery } from 'svelte-apollo'
  import { gql } from 'graphql-tag'
  import type { AgentConnection, Agent } from '@valueflows/vf-graphql'

  import ErrorPage from './__error.svelte'
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

  // map component state

  let panelInfo: any,
      MapComponent: ComponentType,
      agentsQuery: ReadableQuery<QueryResponse> = query(GET_ALL_AGENTS)

  onMount(async () => {
    // defer Leaflet map load until rendering, and only in browser environment
    if (browser) {
      MapComponent = (await import('$lib/Map.svelte')).default
    }
  })

  // reactive data bindings

  let agents: Agent[]

  $: {
    // assign derived values from Agent list API
    let current = agentsQuery && agentsQuery.getCurrentResult()
    if (current) {
      agents = flattenRelayConnection(current.data?.agents)
    }
  }
</script>

<div class="relative h-full w-full">
  {#if agentsQuery !== undefined}
    {#if $agentsQuery.loading}
      <svelte:component this={MapComponent} agents={[]} bind:panelInfo />
    {:else if $agentsQuery.error}
      <ErrorPage status="Problem loading network Agents" error={$agentsQuery.error} />
    {:else if agents}
      <svelte:component this={MapComponent} agents={agents} bind:panelInfo />
      <Search bind:allData={agents} bind:displayData={agents} />
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
