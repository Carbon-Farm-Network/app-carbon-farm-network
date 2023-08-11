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
  let error: Error | null = null

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

      await initData({ variables: {
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
      error = e as Error
      console.log(e)
    }
    dependenciesOk = units.length > 0
    return units
  }

  async function checkDependencies() {
    const res = await getUnits.refetch()
    let units = flattenRelayConnection(res.data?.units)
    dependenciesOk = units.length > 0
  }

  onMount(checkDependencies)
</script>

<div class="p-12">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">

  {#if error}
    <h1 class="text-base font-semibold leading-6 text-gray-900">Error initializing shared data.</h1>
    <p class="mt-2 text-sm text-gray-700">The operation may have timed out. Try freeing up some system resources and restart the app.</p>
  {:else if dependenciesOk === false}
    <h1 class="text-base font-semibold leading-6 text-gray-900">New network detected!</h1>
    <p class="mt-2 text-sm text-gray-700">It looks like you need to initialize some shared data.</p>
    <br />
    <p class="mt-2 text-sm text-gray-700">
      <strong>If somebody else invited you to this network:</strong><br />
      ensure the person who invited you is online and wait for their node to sync with yours. You can check the sync status in the Holochain app store.<br />
      When ready, <button class="px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2" on:click={checkDependencies}>click here</button> to check again.
    </p>
    <br />
    <p class="mt-2 text-sm text-gray-700">
      <strong>If you are the person setting up this network:</strong><br />
      please <button class="px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2" on:click={runInitialization}>click here</button> to create these records.
    </p>
  {:else if dependenciesOk === true}
    <slot></slot>
  {:else}
    <h1 class="text-base font-semibold leading-6 text-gray-900">Checking shared data&hellip;</h1>
    <p class="mt-2 text-sm text-gray-700">(This may take a while the first time the app is opened.)</p>
  {/if}

    </div>
  </div>
</div>
