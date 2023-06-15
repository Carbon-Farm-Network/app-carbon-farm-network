<script lang="ts">
  import { gql } from 'graphql-tag'
  import { createEventDispatcher } from 'svelte';
  import { mutation, query } from 'svelte-apollo'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type { ReadableQuery } from 'svelte-apollo'
  import type { AgentConnection, Agent, UnitConnection } from '@valueflows/vf-graphql'
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

  let units: any;
  let addUnitLb: any = mutation(CREATE_UNIT_LB)
  let addUnit1: any = mutation(CREATE_UNIT_1)

  interface UnitsQueryResponse {
    units: UnitConnection & RelayConn<any>
  }
  let getUnits: ReadableQuery<UnitsQueryResponse> = query(GET_UNITS)

  function addUnits() {
    try {
      addUnit1().then(() => {
      addUnitLb().then(() => {
        getUnits.refetch().then((r) => {
          if (r.data?.units.edges.length > 0) {
            units = flattenRelayConnection(r.data?.units)
            console.log(r)
            console.log('hh')
            dispatch('units', r.data?.units)
          }
        })
      })
    })
    } catch(e) {
      console.log(e)
    }
  }

  onMount(async () => {
    if (browser) {
      try {
        await getUnits.getCurrentResult()
        getUnits.refetch().then((r) => {
          if (r.data?.units.edges.length > 0) {
            units = flattenRelayConnection(r.data?.units)
            console.log(r)
            console.log('hh')
            dispatch('units', r.data?.units)
          }
        })
      } catch (error) {
        console.error(error)
      }
    }
    console.log('Units onMount')
  })

  $: units

</script>

{#if !units}
  <button on:click={() => {addUnits()}} >No units found. Click to generate.</button>
{/if}