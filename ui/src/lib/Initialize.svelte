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
  import { RESOURCE_SPECIFICATION_CORE_FIELDS, UNIT_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'
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

  const ADD_RESOURCE_SPECIFICATION = gql`
    ${RESOURCE_SPECIFICATION_CORE_FIELDS}
    ${UNIT_CORE_FIELDS}
    mutation($resource: ResourceSpecificationCreateParams!){
      createResourceSpecification(resourceSpecification: $resource) {
        resourceSpecification {
          ...ResourceSpecificationCoreFields
          defaultUnitOfResource {
            ...UnitCoreFields
          }
        }
      }
    }
  `

  let units: Unit[];
  let addUnitLb: any = mutation(CREATE_UNIT_LB)
  let addUnit1: any = mutation(CREATE_UNIT_1)
  let addFacetGroups: any = mutation(CREATE_FACET_GROUPS)
  let addResourceSpecification: any = mutation(ADD_RESOURCE_SPECIFICATION)

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
      await addResourceSpecification({ variables: {resource: {
        name: "USD",
        defaultUnitOfResource: units.find(u => u.symbol === 'one')?.id,
      }}})
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
            dispatch('units', r.data?.units)
          }
        })
      } catch (error) {
        console.error(error)
      }
    }
    // console.log('Units onMount')
  })

  $: units
</script>

{#if !units || false}
  <button type="button"
  class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
  style="width: 100px; position: absolute; z-index: 999999"
  on:click={addUnits} >Click here if this is a new app.</button>
{/if}
