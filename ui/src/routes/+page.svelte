<script lang="ts">
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import type { ComponentType } from 'svelte'
  import { query } from 'svelte-apollo'
  import type { ReadableQuery } from 'svelte-apollo'
  import { gql } from 'graphql-tag'
  import type { AgentConnection, Agent, Proposal, ProposalConnection, ProposedIntent } from '@valueflows/vf-graphql'

  import ErrorPage from './__error.svelte'
  import Search from '$lib/Search.svelte'
  import SidePanel from '$lib/SidePanel.svelte'

  import { flattenRelayConnection } from '$lib/graphql/helpers'
  import type { RelayConn } from '$lib/graphql/helpers'
  import { AGENT_CORE_FIELDS, PERSON_CORE_FIELDS, ORGANIZATION_CORE_FIELDS } from '$lib/graphql/agent.fragments'
  import { PROPOSAL_RETURN_FIELDS } from '$lib/graphql/proposal.fragments'
  import { FACET_VALUE_CORE_FIELDS } from '$lib/graphql/facet.fragments'

  let offersList: Proposal[] = [];

  // query & data bindings

  // const GET_ALL_AGENTS = gql`
  //   ${AGENT_CORE_FIELDS}
  //   ${PERSON_CORE_FIELDS}
  //   ${ORGANIZATION_CORE_FIELDS}
  //   fragment FacetCoreFields on Facet {
  //     id
  //     name
  //     note
  //     image
  //     classifiedAs
  //   }
  //   query {
  //     agents(last: 100000) {
  //       edges {
  //         cursor
  //         node {
  //           ...AgentCoreFields
  //           ...PersonCoreFields
  //           ...OrganizationCoreFields

  //           facets(last: 1000) {
  //             edges {
  //               node {
  //                 ...FacetCoreFields
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // `

  const GET_ALL_AGENTS = gql`
    ${AGENT_CORE_FIELDS}
    ${PERSON_CORE_FIELDS}
    ${ORGANIZATION_CORE_FIELDS}
    ${FACET_VALUE_CORE_FIELDS}
    query {
      agents(last: 100000) {
        edges {
          cursor
          node {
            ...AgentCoreFields
            ...PersonCoreFields
            ...OrganizationCoreFields
            facets {
              ...FacetValueCoreFields
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
      MapComponent: ComponentType,
      agentsQuery: ReadableQuery<QueryResponse> = query(GET_ALL_AGENTS)

    async function fetchAgents() {
    // setInterval(function(){
      await agentsQuery.getCurrentResult()
      await agentsQuery.refetch().then((r) => {
        agents = flattenRelayConnection(r.data?.agents).map((a) => {
          let iconUrl = roleImages[a.classifiedAs[2]] || 'mill.svg'
          return {
            ...a,
            "name": a.name,
            "imageUrl": a.image,
            "iconUrl": iconUrl,
            "latLng": {lat: a.classifiedAs[0], lon: a.classifiedAs[1]},
            "address": a.note,
            "offers": offersList?.filter((o: Proposal) => (o.publishes || [])
              .filter((pi: ProposedIntent) => pi.reciprocal && pi.publishes.provider?.id === a.id))
          }
        })
      })
    // }, 20000)
  }

  // ===============GET OFFERS===============
  const GET_All_PROPOSALS = gql`
    ${PROPOSAL_RETURN_FIELDS}
    query {
      proposals(last: 100000) {
        edges {
          cursor
          node {
            ...ProposalReturnFields
          }
        }
      }
    }
  `

  interface OffersQueryResponse {
    proposals: ProposalConnection & RelayConn<any>
  }

  let getOffers: ReadableQuery<OffersQueryResponse> = query(GET_All_PROPOSALS)

  async function fetchOffers() {
    await getOffers.getCurrentResult()
    await getOffers.refetch().then((r) => {
      if (r.data?.proposals.edges.length > 0) {
        offersList = flattenRelayConnection(r.data?.proposals)
        offersList = [...offersList]
      }
    })
  }
  // ===============GET OFFERS ENDS==========

  onMount(async () => {
      await fetchOffers()
      // await agentsQuery.getCurrentResult()
      await fetchAgents()
      // setInterval(function(){
      //   fetchAgents()
      // }, 20000)

    // defer Leaflet map load until rendering, and only in browser environment
    if (browser) {
      MapComponent = (await import('$lib/Map.svelte')).default
    }
  })

  // reactive data bindings

  let agents: Agent[]
  let matchedAgents: Agent[]

  $: agents, offersList;
</script>

<div class="relative h-full w-full">
  {#if agents && agentsQuery !== undefined}
    <!-- {JSON.stringify(agents[0].latlng)} -->
    {#if $agentsQuery.loading && false}
      <svelte:component this={MapComponent} agents={[]} bind:panelInfo />
    {:else if $agentsQuery.error}
      <ErrorPage status="Problem loading network Agents" error={$agentsQuery.error} />
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
