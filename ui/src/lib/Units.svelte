<script lang="ts">
  import { gql } from 'graphql-tag'
  import { createEventDispatcher } from 'svelte';
  import { mutation, query } from 'svelte-apollo'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type { ReadableQuery } from 'svelte-apollo'
  import type { AgentConnection, Agent } from '@valueflows/vf-graphql'
  import type { RelayConn } from '$lib/graphql/helpers'
  import { flattenRelayConnection } from '$lib/graphql/helpers'
  const dispatch = createEventDispatcher();

  const GET_ALL_UNITS = gql`
    query {
      unitsOfEffort {
        id
        name
      }
      unitsOfResource {
        id
        name
      }
    }
  `

  interface UnitsQueryResponse {
    units: AgentConnection & RelayConn<any>
  }
  let unitsQuery: ReadableQuery<UnitsQueryResponse> = query(GET_ALL_UNITS)
  let units;

  async function fetchUnits() {
    setTimeout(function(){
      unitsQuery.refetch().then((r) => {
        units = flattenRelayConnection(r.data?.units).map((a) => {
          return {
            ...a,
          }
        })
        console.log('units v')
        console.log(units)
        console.log('units ^')
      })
    }, 100)
  }

  onMount(async () => {
    if (browser) {
      unitsQuery.getCurrentResult()
      fetchUnits()
    }
    console.log('Units onMount')
  })

</script>