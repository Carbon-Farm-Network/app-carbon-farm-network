<script lang="ts">
  import { gql } from 'graphql-tag'
  import { createEventDispatcher } from 'svelte';
  import { mutation, query } from 'svelte-apollo'
  import { onMount } from 'svelte'
  import type { ReadableQuery } from 'svelte-apollo'
  import type { Unit, UnitConnection } from '@valueflows/vf-graphql'

  import type { RelayConn } from '$lib/graphql/helpers'
  import { flattenRelayConnection } from '$lib/graphql/helpers'
  import { RESOURCE_SPECIFICATION_CORE_FIELDS, UNIT_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'

  const INITIALIZE_UNITS = gql`
    ${UNIT_CORE_FIELDS}
    mutation {
      unitLb: createUnit(
        unit: {
          label: "pound"
          symbol: "lb"
        }
      ){
        unit {
          ...UnitCoreFields
        }
      }
      unitEa: createUnit(
        unit: {
          label: "one"
          symbol: "one"
        }
      ){
        unit {
          ...UnitCoreFields
        }
      }
    }
  `

  const INITIALIZE_GLOBAL_RECORDS = gql`
    ${RESOURCE_SPECIFICATION_CORE_FIELDS}
    ${UNIT_CORE_FIELDS}
    mutation($g1: FacetGroupParams!, $g2: FacetGroupParams!, $resource: ResourceSpecificationCreateParams!) {

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

      rs: createResourceSpecification(resourceSpecification: $resource) {
        resourceSpecification {
          ...ResourceSpecificationCoreFields
          defaultUnitOfResource {
            ...UnitCoreFields
          }
        }
      }

    }
  `

  const GET_UNITS = gql`
    ${UNIT_CORE_FIELDS}
    query {
      units {
        edges {
          cursor
          node {
            ...UnitCoreFields
          }
        }
      }
    }
  `

  let dependenciesOk: boolean | null = null

  const initUnits = mutation<{ unitEa: { unit: Unit }, unitLb: { unit: Unit } }, {}>(INITIALIZE_UNITS)
  const initData = mutation(INITIALIZE_GLOBAL_RECORDS)

  interface UnitsQueryResponse {
    units: UnitConnection & RelayConn<Unit>
  }
  const getUnits: ReadableQuery<UnitsQueryResponse> = query(GET_UNITS)

  // :NOTE: assumes that FacetGroups & ResourceSpecification are not yet created if Units aren't
  async function runInitialization() {
    let units: Unit[] = []
    try {
      const created = await initUnits({})
      units = [created.data?.unitEa.unit as Unit, created.data?.unitLb.unit as Unit]

      const rs = await initData({ variables: {
        g1: {
          name: "Agent",
          note: "All facet classifications relevant to Agent records.",
        },
        g2: {
          name: "Resource Specification",
          note: "All facet classifications relevant to types of resources.",
        },
        resource: {
          name: "USD",
          defaultUnitOfResource: units.find(u => u.symbol === 'one')?.id,
        },
      }})
    } catch(e) {
      console.log(e)
    }
    return units
  }

  onMount(async () => {
    const res = await getUnits.refetch()
    let units = flattenRelayConnection(res.data?.units)

    if (units.length === 0) {
      units = await runInitialization()
    }
    if (units.length > 0) {
      dependenciesOk = true
    } else {
      dependenciesOk = false
    }
  })
</script>

{#if dependenciesOk === true}
  <slot></slot>
{:else if dependenciesOk === false}
  <h1>Error initializing shared data.</h1>
  <p>The operation may have timed out. Try freeing up some system resources and restart the app.</p>
{:else}
  <h1>Loading data...</h1>
  <p>(This may take a while the first time the app is opened.)</p>
{/if}
