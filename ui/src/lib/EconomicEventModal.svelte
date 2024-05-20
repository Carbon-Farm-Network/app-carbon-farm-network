<script lang="ts">
  import { clickOutside } from '../utils'
  import { onMount } from 'svelte'
  import { createEventDispatcher } from 'svelte';
  import type { AgentConnection, Agent, UnitConnection } from '@valueflows/vf-graphql'
  import type { RelayConn } from '$lib/graphql/helpers'
  import type { ReadableQuery } from 'svelte-apollo'
  import { flattenRelayConnection } from '$lib/graphql/helpers'
  import { query } from 'svelte-apollo'
  import { RESOURCE_SPECIFICATION_CORE_FIELDS, UNIT_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'
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
  export let agents: Agent[];
  export let resourceSpecifications: any[];
  export let units: any[];

  const dispatch = createEventDispatcher();

  let name = ''
  let note = ''

  function checkKey(e: any) {
    if (e.key === 'Escape' && !e.shiftKey) {
      e.preventDefault()
      open = false
    }
  }

  onMount(async() => {
    window.addEventListener('keydown', checkKey)
  })

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
      hasUnitId: ''
    },
    receiverId: '',
    providerId: '',
    note: '',
    fulfilledBy: [],
    finished: false
  }
  let newCommitment = Object.assign({}, newCommitmentTemplate)
  let selectedCommitment = Object.assign({}, newCommitmentTemplate)
  $: commitmentModalColumn, commitmentModalProcess, commitmentModalSide, selectedCommitment, selectedCommitmentId

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
  <div
    class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
    class:hidden={!open}
  />

  <div class="fixed inset-0 z-10 overflow-y-auto" class:hidden={!open}>
    <div
      class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
    >
      <div
        class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
        class:hidden={!open}
        use:clickOutside
      >
        <div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
              Record Economic Event
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
                  <select
                    id="provider"
                    name="provider"
                    class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    value={selectedCommitment.provider.id}
                    on:change={(e) => {
                      let id = e.target.value
                      console.log(id)
                      let selectedAgent = agents.find((rs) => rs.id === id)
                      console.log(selectedAgent.name)
                      if (selectedCommitment.provider) {
                        selectedCommitment.provider = selectedAgent
                      } else {
                        console.log(selectedCommitment.provider)
                      }
                    }}

                    >
                    {#each agents as agent}
                      <option value={agent.id}>{agent.name}</option>
                    {/each}
                  </select>
                {:else if agents}
                  <select
                    id="provider"
                    name="provider"
                    class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    value={""}
                    on:change={(e) => {
                      let id = e.target.value
                      console.log(id)
                      let selectedAgent = agents.find((rs) => rs.id === id)
                      if (newCommitment.provider) {
                        newCommitment.provider = selectedAgent
                      } else {
                        console.log(newCommitment.provider)
                      }
                    }}
                    >
                    {#each agents as agent}
                      <option value={agent.id}>{agent.name}</option>
                    {/each}
                  </select>
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
                {#if selectedCommitment?.id && selectedCommitment.receiverId}
                  <!-- <p>{selectedCommitment.receiver.name}</p> -->
                  {#each agents as agent}
                    {#if agent.id == selectedCommitment.receiverId}
                      {agent.name}
                    {/if}
                  {/each}
                {:else if selectedCommitment?.id && agents}
                  <select
                    id="receiver"
                    name="receiver"
                    class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    value={""}
                    on:change={(e) => {
                      let id = e.target.value
                      console.log(id)
                      selectedCommitment.receiverId = id
                    }}
                    >
                    {#each agents as agent}
                      <option value={agent.id}>{agent.name}</option>
                    {/each}
                  </select>
                {:else if agents}
                  <select
                    id="receiver"
                    name="receiver"
                    class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    value={newCommitment.receiverId}
                    on:change={(e) => {
                      let id = e.target.value
                      console.log(id)
                      newCommitment.receiverId = id
                    }}
                    >
                    {#each agents as agent}
                      <option value={agent.id}>{agent.name}</option>
                    {/each}
                  </select>
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
                {:else if resourceSpecifications}
                    <select
                    id="defaultUnitOfResource"
                    name="defaultUnitOfResource"
                    class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    value={newCommitment.resourceConformsTo.name}
                      on:change={(e) => {
                        console.log(e.target.value)
                        const rspec = resourceSpecifications.find((rs) => rs.name === e.target.value)
                        newCommitment.resourceConformsTo.defaultUnitOfResource = rspec.defaultUnitOfResource
                        newCommitment.resourceConformsTo = rspec
                      }}
                    >
                    {#each resourceSpecifications as rs}
                      <option value={rs.name}>{rs.name}</option>
                    {/each}
                  </select>
                {/if}
              </div>
            </div>

            <!-- action selector -->
            <div class="mt-4 text-left">
              <div>
                <label
                  for="action"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Action</label
                >
                {#if selectedCommitment?.id && selectedCommitment?.action}
                  <p>{selectedCommitment?.action.label}</p>
                {:else}
                  <select
                    id="action"
                    name="action"
                    class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    bind:value={newCommitment.action.label}
                  >
                    {#each actions as action}
                      <option value={action}>{action}</option>
                    {/each}
                  </select>
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
                    <input
                      type="number"
                      name="quantity"
                      id="quantity"
                      class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      placeholder=""
                      bind:value={selectedCommitment.resourceQuantity
                        .hasNumericalValue}
                      required
                      aria-invalid="true"
                      aria-describedby="name-error"
                    />
                  {:else}
                    <input
                      type="number"
                      name="quantity"
                      id="quantity"
                      class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      placeholder=""
                      bind:value={newCommitment.resourceQuantity.hasNumericalValue}
                      required
                      aria-invalid="true"
                      aria-describedby="name-error"
                    />
                  {/if}
                </div>
              </div>

              <div>
                <label
                  for="unit"
                  class="block text-sm font-medium leading-6 text-gray-900">Unit</label
                >
                {#if selectedCommitment?.id && selectedCommitment?.resourceQuantity}
                  <!-- <p>{selectedCommitment?.resourceQuantity.hasUnit.label}</p> -->
                  {#each units as unit}
                    {#if unit.id == selectedCommitment?.resourceQuantity?.hasUnitId}
                      {unit.label}
                    {/if}
                  {/each}
                {:else}
                  <select
                    id="unit"
                    name="unit"
                    class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    bind:value={newCommitment.resourceQuantity.hasUnitId}
                  >
                    {#if units}
                      {#each units as unit}
                        <option value={unit.id}>{unit.label}</option>
                      {/each}
                    {/if}
                  </select>
                {/if}
              </div>
            </div>

            <div class="mt-4 text-left">
              <div class="col-span-full">
                <label
                  for="note"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Description</label
                >
                <div class="mt-2">
                  {#if selectedCommitment.id}
                    <textarea
                      id="note"
                      name="note"
                      rows="3"
                      class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      bind:value={selectedCommitment.note}
                    />
                  {:else}
                    <textarea
                      id="note"
                      name="note"
                      rows="3"
                      class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      bind:value={newCommitment.note}
                    />
                  {/if}

                  <div class="mt-4 text-left">
                    <!-- <div class="mt-4 flex items-center">
                      <input
                        id="save_cost"
                        name="save_cost"
                        type="checkbox"
                        checked={saveCost}
                        on:change={(e) => {
                          saveCost = e.target.checked
                        }}
                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label for="save_cost" class="ml-2 block text-sm text-gray-900">Save cost</label>
                    </div> -->
                    <div class="mt-4 flex items-center">
                      <input type="checkbox" id="finished" 
                        on:change={(e) => {
                          let tempFinished = e.target.checked
                          console.log(tempFinished)
                          selectedCommitment.finished = tempFinished
                          console.log(selectedCommitment.finished)
                        }}
                        bind:checked={selectedCommitment.finished} 
                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        >

                        <label
                        for="date"
                        class="block text-sm font-medium leading-6 text-gray-900"
                        >&nbsp;Commitment finished</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          {#if selectedCommitmentId}
          <button
          type="button"
          class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
          on:click={() => {
            console.log("selected commitment", selectedCommitment)
            let updatedCommitment = {...selectedCommitment}
            if (!selectedCommitment.provider) {
              updatedCommitment.provider = newCommitment.provider
            }
            if (!selectedCommitment.receiver) {
              updatedCommitment.receiver = newCommitment.receiver
            }
            if (!selectedCommitment.resourceConformsTo) {
              updatedCommitment.resourceConformsTo = newCommitment.resourceConformsTo
            }
            if (!selectedCommitment.resourceQuantity) {
              updatedCommitment.resourceQuantity = newCommitment.resourceQuantity
            }
            if (!selectedCommitment.action) {
              updatedCommitment.action = newCommitment.action
            }
            if (!selectedCommitment.note) {
              updatedCommitment.note = newCommitment.note
            }

            // updatedCommitment.finished = selectedCommitment.finished
            console.log("selected commitment2 ", selectedCommitment)

            dispatch('submit', {
              column: commitmentModalColumn,
              process: commitmentModalProcess,
              side: commitmentModalSide,
              commitment: updatedCommitment,
              useAs: 'update'
            });
            open = false;
          }}
          >Add Event</button>
          <!-- {:else}
          <button
            type="button"
            class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
            on:click={() => {
                console.log(newCommitment)
                dispatch('submit', {
                  column: commitmentModalColumn,
                  process: commitmentModalProcess,
                  side: commitmentModalSide,
                  commitment: {
                    ...newCommitment,
                    id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
                  },
                  useAs: 'new'
                });
              open = false
            }}
          >
            Add
          </button> -->
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
