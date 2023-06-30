<script lang="ts">
  import { gql } from 'graphql-tag'
  import { createEventDispatcher } from 'svelte';
  import { mutation, query } from 'svelte-apollo'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type { ReadableQuery } from 'svelte-apollo'
  import type { AgentConnection, Agent, Unit, UnitConnection } from '@valueflows/vf-graphql'
  import type { RelayConn } from './graphql/helpers'
  import { flattenRelayConnection } from './graphql/helpers'
  const dispatch = createEventDispatcher();

  const CREATE_UNIT_LB = gql`
    mutation CreateUnit {
      createUnit(
        unit: {
          label: "pound"
          symbol: "lb"
        }
      ){
        unit {
          id
          label
          symbol
        }
      }
    }`

  const CREATE_UNIT_1 = gql`
    mutation CreateUnit {
      createUnit(
        unit: {
          label: "one"
          symbol: "one"
        }
      ){
        unit {
          id
          label
          symbol
        }
      }
    }
  `

  const GET_UNITS = gql`
    query GetUnits {
      units {
        edges {
          cursor
          node {
            id
            label
            symbol
          }
        }
      }
    }
  `

  const CREATE_FACET_GROUPS = gql`
    mutation($g1: FacetGroupParams!, $g2: FacetGroupParams!) {
      g1: putFacetGroup(facetGroup: $g1) {
        facetGroup {
          id
          revisionId
          name
        }
      }
      g2: putFacetGroup(facetGroup: $g2) {
        facetGroup {
          id
          revisionId
          name
        }
      }
    }
  `

  let units: Unit[];
  let addUnitLb: any = mutation(CREATE_UNIT_LB)
  let addUnit1: any = mutation(CREATE_UNIT_1)
  let addFacetGroups: any = mutation(CREATE_FACET_GROUPS)

  interface UnitsQueryResponse {
    units: UnitConnection & RelayConn<any>
  }
  let getUnits: ReadableQuery<UnitsQueryResponse> = query(GET_UNITS)

  async function addUnits() {
    try {
      await addUnit1()
      await addUnitLb()
      const r = await getUnits.refetch()
      if (r.data?.units.edges.length > 0) {
        units = flattenRelayConnection(r.data?.units)
        dispatch('units', units)
      }
      let c = await addFacetGroups({ variables: {
        g1: {
          name: "Agent",
          note: "All facet classifications relevant to Agent records.",
        },
        g2: {
          name: "Resource Specification",
          note: "All facet classifications relevant to types of resources.",
        },
      }})
      console.log('FacetGroups', c)
    } catch(e) {
      console.log(e)
    }
  }

  onMount(async () => {
    await addUnits()
    console.log('Units onMount')
  })

  $: units
</script>

{#if !units || false}
  <button on:click={addUnits} >No units found. Click to generate.</button>
{/if}
