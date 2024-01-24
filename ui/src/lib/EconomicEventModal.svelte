<script lang="ts">
  import { clickOutside } from './utils'
  import { onMount } from 'svelte'
  import { createEventDispatcher } from 'svelte';
  // import agents from '$lib/data/agents.json'
  import type { AgentConnection, Agent, UnitConnection } from '@valueflows/vf-graphql'
  import type { RelayConn } from '$lib/graphql/helpers'
  import type { ReadableQuery } from 'svelte-apollo'
  import { flattenRelayConnection } from '$lib/graphql/helpers'
  import { query } from 'svelte-apollo'
  import { RESOURCE_SPECIFICATION_CORE_FIELDS, UNIT_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'
  // import resource_specifications from '$lib/data/resource_specifications.json'
  // import units from '$lib/data/units.json'
  import actions from '$lib/data/actions.json'
  import { gql } from 'graphql-tag'
  import { AGENT_CORE_FIELDS, PERSON_CORE_FIELDS, ORGANIZATION_CORE_FIELDS } from '$lib/graphql/agent.fragments'

  export let open = false
  export let commitmentModalColumn: number | undefined;
  export let commitmentModalProcess: number | undefined;
  export let commitmentModalSide: string | undefined;
  export let selectedCommitmentId: string | undefined
  export let process: any[];
  export let commitments: any[]
  const dispatch = createEventDispatcher();

  let name = ''
  let note = ''
  let agents: Agent[];
  let resourceSpecifications: any[];
  let units: any[];

  // $: if (open) {
    // newCommitment.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    // console.log(newCommitment.id)
    // console.log(process)
  // }

  function checkKey(e: any) {
    if (e.key === 'Escape' && !e.shiftKey) {
      e.preventDefault()
      // selectedCommitmentId = undefined
      // previousSelectedCommitmentId = undefined
      open = false
    }
  }

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

  const GET_ALL_AGENTS = gql`
    query {
      agents(last: 100000) {
        edges {
          cursor
          node {
            id
            name
          }
        }
      }
    }
  `

const GET_ALL_RESOURCE_SPECIFICATIONS = gql`
    ${RESOURCE_SPECIFICATION_CORE_FIELDS}
    ${UNIT_CORE_FIELDS}
    query {
      resourceSpecifications(last: 100000) {
        edges {
          cursor
          node {
            ...ResourceSpecificationCoreFields
            defaultUnitOfResource {
              ...UnitCoreFields
            }
          }
        }
      }
    }
  `

  interface QueryResponse {
    agents: AgentConnection & RelayConn<any>
  }

  interface RspecResponse {
    resourceSpecifications: AgentConnection & RelayConn<any>
  }


  interface UnitsQueryResponse {
    units: UnitConnection & RelayConn<any> //& RelayConn<unknown> | null | undefined
  }

  let getUnits: ReadableQuery<UnitsQueryResponse> = query(GET_UNITS)
  
  // map component state
  let agentsQuery: ReadableQuery<QueryResponse> = query(GET_ALL_AGENTS)

  let resourceSpecificationsQuery: ReadableQuery<RspecResponse> = query(GET_ALL_RESOURCE_SPECIFICATIONS)

  async function fetchUnits() {
    getUnits.getCurrentResult()
    getUnits.refetch().then((r) => {
      if (r.data?.units.edges.length > 0) {
        units = flattenRelayConnection(r.data?.units)
      }
    })
  }

  async function fetchAgents() {
    await agentsQuery.getCurrentResult()
    const a = await agentsQuery.refetch()
    agents = flattenRelayConnection(a.data?.agents).map((a) => {
      return {
        ...a,
      }
    })
    console.log(agents)
  }

  async function fetchResourceSpecifications() {
    await resourceSpecificationsQuery.getCurrentResult()
    let r = await resourceSpecificationsQuery.refetch()
    resourceSpecifications = flattenRelayConnection(r.data?.resourceSpecifications).map((a) => {
      return {
        ...a,
        defaultUnitOfResourceId: a.defaultUnitOfResource?.id,
      }
    })
    console.log(resourceSpecifications)
  }

  onMount(async() => {
    window.addEventListener('keydown', checkKey)
    await fetchUnits();
    await fetchAgents();
    await fetchResourceSpecifications();
  })

  // let selectedCommitment: any;
  let newCommitmentTemplate = {
    id: undefined,
    resourceConformsTo: {
      name: '',
      defaultUnitOfResource: {
        label: ''
      }
    },
    action: {label: ''},
    resourceQuantity: {
      hasNumericalValue: 0,
      hasUnit: {
        label: ''
      }
    },
    receiver: {
      id: '',
      name: ''
    },
    provider: {
      id: '',
      name: ''
    },
    note: ''
  }
  let newCommitment = Object.assign({}, newCommitmentTemplate)
  let selectedCommitment = Object.assign({}, newCommitmentTemplate)
  // $: selectedCommitment = commitments.find(it => it.id == selectedCommitmentId)
  $: commitmentModalColumn, commitmentModalProcess, commitmentModalSide, selectedCommitment, selectedCommitmentId
  // $: if (selectedCommitmentId && commitmentModalColumn > -1) {
  //   // selectedCommitment = {...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide].find(it => it.id == selectedCommitmentId)}
  //   // console.log(selectedCommitmentId)
  //   // console.log(process)
  //   // selectedCommitment = process.find(it => it.id == selectedCommitmentId)
  //   selectedCommitment = JSON.parse(JSON.stringify(process.find(it => it.id == selectedCommitmentId)));
  //   console.log(selectedCommitment)
  // } else {
  //   // console.log(selectedCommitmentId, commitmentModalColumn)
  //   // selectedCommitment = {}
  // }

  let previousSelectedCommitmentId: string | undefined;
  $: {
    if (selectedCommitmentId !== previousSelectedCommitmentId) {
      previousSelectedCommitmentId = selectedCommitmentId;
      if (selectedCommitmentId && commitmentModalColumn > -1) {
        selectedCommitment = JSON.parse(JSON.stringify(process.find(it => it.id == selectedCommitmentId)));
      } else if (selectedCommitmentId && commitmentModalColumn == undefined) {
        console.log(commitments)
        selectedCommitment = JSON.parse(JSON.stringify(commitments.find(it => it.id == selectedCommitmentId)));
        console.log(selectedCommitment)
      } else {
        selectedCommitment = {};
      }
    }
  }

</script>


<div class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
  <!--
    Background backdrop, show/hide based on modal state.

    Entering: "ease-out duration-300"
      From: "opacity-0"
      To: "opacity-100"
    Leaving: "ease-in duration-200"
      From: "opacity-100"
      To: "opacity-0"
  -->
  <div
    class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
    class:hidden={!open}
  />

  <div class="fixed inset-0 z-10 overflow-y-auto" class:hidden={!open}>
    <div
      class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
    >
      <!--
        Modal panel, show/hide based on modal state.

        Entering: "ease-out duration-300"
          From: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          To: "opacity-100 translate-y-0 sm:scale-100"
        Leaving: "ease-in duration-200"
          From: "opacity-100 translate-y-0 sm:scale-100"
          To: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
      -->
      <div
        class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
        class:hidden={!open}
        use:clickOutside
      >
        <div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
              Economic Event
            </h3>

            <div class="mt-4 text-left">
              <div>
                <label
                  for="provider"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Provider</label
                >
                <!-- {JSON.stringify(selectedCommitment.provider)} -->
                {#if selectedCommitment?.id && selectedCommitment?.provider && agents}
                  <div>{selectedCommitment.provider.name}</div>
                {/if}
              </div>
            </div>

            <div class="mt-4 text-left">
              <div>
                <label
                  for="receiver"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Receiver</label
                >
                {#if selectedCommitment?.id && selectedCommitment.receiver}
                  <p>{selectedCommitment.receiver.name}</p>
                {/if}
              </div>
            </div>

            <div class="mt-4 text-left">
              <div>
                <label
                  for="defaultUnitOfResource"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Resource specification</label
                >
                {#if selectedCommitment?.id && selectedCommitment?.resourceConformsTo}
                  <p>{selectedCommitment?.resourceConformsTo.name}</p>
                {/if}
              </div>
            </div>

             <!-- <div class="mt-4 text-left">
              <div>
                <label
                  for="action"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Action</label
                >
                {#if selectedCommitment?.id && selectedCommitment?.action}
                  <p>{selectedCommitment?.action.label}</p>
                {/if}
              </div>
            </div> -->

            <div class="mt-4 text-left">
              <div>
                <label
                  for="date"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Date</label
                >
                {#if selectedCommitment?.id && selectedCommitment?.hasBeginning}
                  <p>{new Date(selectedCommitment?.hasBeginning).toLocaleDateString()}</p>
                {/if}
              </div>
            </div>

            <div class="mt-4 text-left flex justify-between">
              <div class="text-left">
                <label
                  for="name"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Quantity</label
                >
                <div class="relative mt-2 rounded-md shadow-sm">
                  {#if selectedCommitment?.resourceQuantity}
                    <div>{selectedCommitment.resourceQuantity.hasNumericalValue}</div>                  
                  {/if}
                </div>
              </div>

              <div>
                <label
                  for="unit"
                  class="block text-sm font-medium leading-6 text-gray-900">Unit</label
                >
                {#if selectedCommitment?.id && selectedCommitment?.resourceQuantity}
                  <p>{selectedCommitment?.resourceQuantity.hasUnit.label}</p>
                {/if}
              </div>
            </div>

            {#if selectedCommitment.id && selectedCommitment.note}
            <div class="mt-4 text-left">
              <div class="col-span-full">
                <label
                  for="note"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Description</label
                >
                <div class="mt-2">
                  <div>{selectedCommitment.note}</div>
                </div>
                <!-- <p class="mt-3 text-sm leading-6 text-gray-600">
                  Description for the description field
                </p> -->
              </div>
            </div>
            {/if}

            <div class="mt-4 text-left">
              <div>
                <label
                  for="date"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Commitment finished</label
                >
                <!-- {#if selectedCommitment?.id && selectedCommitment?.finished} -->
                  <!-- checkbox -->
                  <input type="checkbox" id="finished" bind:checked={selectedCommitment.finished} class="mt-2">
                <!-- {/if} -->
              </div>
            </div>

          </div>
        </div>
        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          {#if selectedCommitmentId}
          <button
          type="button"
          class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
          on:click={() => {
            
            open = false;
          }}
          >Save changes</button>
          {/if}
          <button
            type="button"
            on:click={() => (open = false)}
            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
            >Cancel</button
          >
        </div>
      </div>
    </div>
  </div>
</div>
