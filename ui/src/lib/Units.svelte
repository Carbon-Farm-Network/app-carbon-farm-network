<script lang="ts">
  import { gql } from 'graphql-tag'
  import { createEventDispatcher } from 'svelte';
  import { mutation, query } from 'svelte-apollo'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type { ReadableQuery } from 'svelte-apollo'
  import type { AgentConnection, Agent, UnitConnection } from '@valueflows/vf-graphql'
  import type { RelayConn } from '$lib/graphql/helpers'
  import { flattenRelayConnection } from '$lib/graphql/helpers'
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
          symbol: "1"
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

  let addUnitLb: any = mutation(CREATE_UNIT_LB)
  let addUnit1: any = mutation(CREATE_UNIT_1)

  interface UnitsQueryResponse {
    units: UnitConnection & RelayConn<any>
  }
  let getUnits: ReadableQuery<UnitsQueryResponse> = query(GET_UNITS)

  onMount(async () => {
    if (browser) {
      try {
        await getUnits.getCurrentResult()
        getUnits.refetch().then((r) => {
          if (r.data?.units.edges.length > 0) {
            console.log(r)
            dispatch('units', r.data?.units)
          } else {
            addUnitLb().then(() => {
              addUnit1()
            })
          }
        })
      } catch (error) {
        console.error(error)
      }
    }
    console.log('Units onMount')
  })

</script>