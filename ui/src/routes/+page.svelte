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
  import { AGENT_CORE_FIELDS, PERSON_CORE_FIELDS, ORGANIZATION_CORE_FIELDS } from '$lib/graphql/agent.fragments'

  // query & data bindings

  const GET_ALL_AGENTS = gql`
    ${AGENT_CORE_FIELDS}
    ${PERSON_CORE_FIELDS}
    ${ORGANIZATION_CORE_FIELDS}
    query {
      agents(last: 100000) {
        edges {
          cursor
          node {
            ...AgentCoreFields
            ...PersonCoreFields
            ...OrganizationCoreFields
          }
        }
      }
    }
  `

  interface QueryResponse {
    // agents: AgentConnection & RelayConn<Agent>
      agents: AgentConnection & RelayConn<any>
  }

  // map component state

  let panelInfo: any,
      MapComponent: ComponentType,
      agentsQuery: ReadableQuery<QueryResponse> = query(GET_ALL_AGENTS)

    async function fetchAgents() {
    setInterval(function(){
      agentsQuery.refetch().then((r) => {
        agents = flattenRelayConnection(r.data?.agents).map((a) => {
          return {
            ...a,
            "name": a.name,
            "imageUrl": a.image,
            "iconUrl": a.image,
            "latLng": {lat: a.classifiedAs[0], lon: a.classifiedAs[1]},
            "address": a.note,
          }
        })
        console.log(agents)
      })
    }, 10000)
  }

  onMount(async () => {
    // defer Leaflet map load until rendering, and only in browser environment
    if (browser) {
      agentsQuery.getCurrentResult()
      fetchAgents()
      MapComponent = (await import('$lib/Map.svelte')).default
    }
  })

  // reactive data bindings

  let agents: Agent[]

  $: agents;
</script>

<div class="relative h-full w-full">
  {#if agents && agentsQuery !== undefined}
    <!-- {JSON.stringify(agents[0].latlng)} -->
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
