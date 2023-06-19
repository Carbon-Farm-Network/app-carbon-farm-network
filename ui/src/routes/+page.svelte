<script lang="ts">
  // import { browser } from '$app/environment'
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
  import Initialize from '$lib/Initialize.svelte'

  // query & data bindings

  const GET_ALL_AGENTS = gql`
    ${AGENT_CORE_FIELDS}
    ${PERSON_CORE_FIELDS}
    ${ORGANIZATION_CORE_FIELDS}
    fragment FacetCoreFields on Facet {
      id
      name
      note
      image
      classifiedAs
    }
    query {
      agents(last: 100000) {
        edges {
          cursor
          node {
            ...AgentCoreFields
            ...PersonCoreFields
            ...OrganizationCoreFields

            facets(last: 1000) {
              edges {
                node {
                  ...FacetCoreFields
                }
              }
            }
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
    // setInterval(function(){
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
        console.log(agentsQuery)
      })
    // }, 20000)
  }

  onMount(async () => {
    // defer Leaflet map load until rendering, and only in browser environment
    // if (browser) {
      agentsQuery.getCurrentResult()
      fetchAgents()
      setInterval(function(){
        fetchAgents()
      }, 20000)
      MapComponent = (await import('$lib/Map.svelte')).default
    // }
  })

  // reactive data bindings

  let agents: Agent[]

  $: agents;
</script>
<Initialize />

<div class="relative h-full w-full">
  {#if agents && agentsQuery !== undefined}
    <!-- {JSON.stringify(agents[0].latlng)} -->
    {#if $agentsQuery.loading && false}
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
