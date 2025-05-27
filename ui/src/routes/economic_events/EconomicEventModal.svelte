<script lang="ts">
  import { clickOutside } from '../../utils'
  import { onMount } from 'svelte'
  import { createEventDispatcher } from 'svelte';
  import { cloneDeep } from "lodash"
  import { ensure } from '../../crud/fetch';
  import { allProcessSpecifications, allAgents } from '../../crud/store';
  import actions from '$lib/data/actions.json'

  export let open = false
  export let raiseOnly = false
  export let commitmentModalColumn: number | undefined;
  export let commitmentModalProcess: number | undefined;
  export let commitmentModalSide: string | undefined;
  export let selectedCommitmentId: string | undefined
  export let selectedCommitment: any;
  export let process: any[];
  export let independentDemands: any[]
  export let nonProcessCommitments: any[]
  export let resourceSpecifications: any[];
  export let units: any[];

  let agents: any[] = [];
  allAgents.subscribe(value => {
    agents = value;
  });
  
  const dispatch = createEventDispatcher();
  
  let name = ''
  let note = ''
  
  function checkKey(e: any) {
    if (e.key === 'Escape' && !e.shiftKey) {
      e.preventDefault()
      open = false
    }
  }
  
  let newInventoriedResource = {
    name: '',
    stage: '',
    image: '',
    conformsTo: null,
    trackingIdentifier: '',//crypto.randomUUID(),
    note: '',
  }

  let newEventTemplate = {
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
  let newEvent = Object.assign({}, newEventTemplate)
  $: selectedEvent = cloneDeep(selectedCommitment) || Object.assign({}, newEventTemplate)
  $: commitmentModalColumn, commitmentModalProcess, commitmentModalSide, selectedEvent, selectedCommitmentId
  $: provider = selectedEvent?.providerId ? agents.find(a => a.id == selectedEvent?.providerId) : selectedEvent?.provider
  $: receiver = selectedEvent?.receiverId ? agents.find(a => a.id == selectedEvent?.receiverId) : selectedEvent?.receiver
  $: resourceSectionIsValid = newInventoriedResource.name && newInventoriedResource.stage
  $: eventSectionIsValid = newEvent?.providerId && newEvent?.receiverId && newEvent?.resourceConformsTo && newEvent?.action && newEvent?.resourceQuantity?.hasNumericalValue && newEvent?.resourceQuantity?.hasUnitId
  $: isValid = eventSectionIsValid && (!raiseOnly || resourceSectionIsValid)

  onMount(async() => {
    window.addEventListener('keydown', checkKey)
    await ensure(['processSpecification', 'agent', 'resourceSpecification'])
    if (raiseOnly) {
      //@ts-ignore
      newEvent.action = actions.find(it => it == "raise")
      newEvent.note = "Inventory at system startup"
    }
  })

  let previousSelectedCommitmentId: string | undefined;
  $: {
    if (selectedCommitmentId !== previousSelectedCommitmentId) {
      previousSelectedCommitmentId = selectedCommitmentId;
      if (selectedCommitmentId && commitmentModalColumn > -1) {
        try {
          selectedEvent = cloneDeep(process.find(it => it.id == selectedCommitmentId))
        } catch (e) {
          try {
            // look in clauseOf of process commitments
            console.log("looking in clauseOf of", process, selectedCommitmentId)
            let clauseOf = process?.find(it => it?.clauseOf?.commitments?.find(it => it.action.label == "transfer")?.id == selectedCommitmentId);
            selectedEvent = clauseOf?.clauseOf?.commitments?.find(it => it.action.label == "transfer");
            console.log("selected commitment", selectedEvent)
            
            if (!selectedEvent) {
              console.log(selectedCommitmentId, independentDemands, independentDemands.find(it => it.id == selectedCommitmentId))
              const foundCom = independentDemands.find(it => it.id == selectedCommitmentId)
              selectedEvent = cloneDeep(foundCom)
              console.log(selectedEvent)
              if (!selectedEvent) {
                const foundCom = nonProcessCommitments.find(it => it.id == selectedCommitmentId)
                console.log(selectedCommitmentId, nonProcessCommitments, foundCom)
                selectedEvent = cloneDeep(foundCom)
              }
            }
          } catch (e) {
            console.log(e)
          }
        }
      } else if (selectedEvent) {
        selectedEvent = selectedEvent
      } else if (selectedCommitmentId && commitmentModalColumn == undefined) {
        try {
          selectedEvent = cloneDeep(independentDemands.find(it => it.id == selectedCommitmentId))
          console.log(selectedEvent)
          if (!selectedEvent) {
            selectedEvent = cloneDeep(nonProcessCommitments.find(it => it.id == selectedCommitmentId))
          }
        } catch (e) {
          try {
            selectedEvent = cloneDeep(nonProcessCommitments.find(it => it.id == selectedCommitmentId))
          } catch (e) {
            console.log(e)
          }
        } 
      } else {
        selectedEvent = Object.assign({}, newEventTemplate)
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
              {raiseOnly ? 'Record Beginning Inventory Event' : 'Record Economic Event'}
            </h3>

            <!-- <div id="outer" class="mt-4 grid grid-cols-2 gap-4"> -->
             <div id="outer" >
              <div id="left">
                  <div class="mt-4 text-left">
                    <div>
                      <label
                        for="provider"
                        class="block text-sm font-medium leading-6 text-gray-900"
                        >Provider</label
                      >
                      {#if selectedEvent?.id && provider}
                        <select
                          id="provider"
                          name="provider"
                          class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          value={selectedEvent.providerId}
                          on:change={(e) => {
                            let id = e.target.value
                            let selectedAgent = agents.find((rs) => rs.id === id)
                            if (selectedEvent.provider) {
                              selectedEvent.provider = selectedAgent
                              selectedEvent.providerId = selectedAgent.id
                            } else if (selectedEvent.providerId) {
                              console.log(selectedEvent.provider)
                              selectedEvent.providerId = selectedAgent.id
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
                            newEvent.providerId = selectedAgent.id
                            if (newEvent.provider) {
                              newEvent.provider = selectedAgent
                            } else {
                              console.log(newEvent.provider)
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
                      {#if selectedEvent?.id && selectedEvent.receiverId}
                        <!-- <p>{selectedEvent.receiver.name}</p> -->
                        {#each agents as agent}
                          {#if agent.id == selectedEvent.receiverId}
                            {agent.name}
                          {/if}
                        {/each}
                      {:else if selectedEvent?.id && agents}
                        <select
                          id="receiver"
                          name="receiver"
                          class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          value={""}
                          on:change={(e) => {
                            let id = e.target.value
                            console.log(id)
                            selectedEvent.receiverId = id
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
                          value={newEvent.receiverId}
                          on:change={(e) => {
                            let id = e.target.value
                            console.log(id)
                            let selectedAgent = agents.find((rs) => rs.id === id)
                            newEvent.receiverId = selectedAgent.id
                            if (newEvent.receiver) {
                              newEvent.receiver = selectedAgent
                            } else {
                              console.log(newEvent.receiver)
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
                        for="defaultUnitOfResource"
                        class="block text-sm font-medium leading-6 text-gray-900"
                        >Resource specification</label
                      >
                      {#if selectedEvent?.id && selectedEvent?.resourceConformsTo}
                        <p>{selectedEvent?.resourceConformsTo.name}</p>
                      {:else if resourceSpecifications}
                          <select
                          id="defaultUnitOfResource"
                          name="defaultUnitOfResource"
                          class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          value={newEvent.resourceConformsTo.name}
                            on:change={(e) => {
                              console.log(e.target.value)
                              const rspec = resourceSpecifications.find((rs) => rs.name === e.target.value)
                              newEvent.resourceConformsTo.defaultUnitOfResource = rspec.defaultUnitOfResource
                              newEvent.resourceConformsTo = rspec
                              newInventoriedResource.name = rspec.name
                              newInventoriedResource.conformsTo = rspec
                              newInventoriedResource.image = rspec.image
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
                      {#if selectedEvent?.id && selectedEvent?.action}
                        <p>{selectedEvent?.action.label}</p>
                      {:else if raiseOnly}
                        <p>raise</p>
                      {:else}
                        <select
                          id="action"
                          name="action"
                          class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          bind:value={newEvent.action.label}
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
                      <div class="relative mt-2 rounded-md shadow-sm w-5/6">
                      {#if selectedEvent?.resourceQuantity}
                        <input
                        type="number"
                        name="quantity"
                        id="quantity"
                        class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder=""
                        value={selectedEvent.resourceQuantity
                          .hasNumericalValue}
                          on:change={(e) => {
                            selectedEvent.resourceQuantity.hasNumericalValue = Number(e.target.value)
                          }}
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
                        bind:value={newEvent.resourceQuantity.hasNumericalValue}
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
                      {#if selectedEvent?.id && selectedEvent?.resourceQuantity}
                        <!-- <p>{selectedEvent?.resourceQuantity.hasUnit.label}</p> -->
                        {#each units as unit}
                          {#if unit.id == selectedEvent?.resourceQuantity?.hasUnitId}
                            {unit.label}
                          {/if}
                        {/each}
                      {:else}
                        <select
                          id="unit"
                          name="unit"
                          class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          bind:value={newEvent.resourceQuantity.hasUnitId}
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
                        {#if selectedEvent?.id}
                          <textarea
                            id="note"
                            name="note"
                            rows="3"
                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            bind:value={selectedEvent.note}
                          />
                        {:else}
                          <textarea
                            id="note"
                            name="note"
                            rows="3"
                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            bind:value={newEvent.note}
                          />
                        {/if}

                        {#if selectedEvent?.id}
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
                                  selectedEvent.finished = tempFinished
                                  console.log(selectedEvent.finished)
                                }}
                                checked={selectedEvent.finished} 
                                class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                >

                                <label
                                for="date"
                                class="block text-sm font-medium leading-6 text-gray-900"
                                >&nbsp;Commitment finished</label>
                            </div>
                          </div>
                        {/if}
                      </div>
                    </div>
                  </div>

                <!-- end left side -->
                <!-- </div> 
                <div id="right"> -->

                  <!-- IF RAISE EVENT WITH RESOURCE -->
                  {#if raiseOnly}
                    <div class="mt-4 text-left">
                      <!-- <h3 class="text-base font-semibold leading-6 text-gray-900 text-center mt-4">New Resource</h3> -->
                      <!-- name, stage, tracking identifier, note -->
                      <div class="mt-4 text-left">
                        <div>
                          <label
                            for="name"
                            class="block text-sm font-medium leading-6 text-gray-900"
                            >Resource Name</label
                          >
                          <div class="relative mt-2 rounded-md shadow-sm">
                            <input
                              type="text"
                              name="name"
                              id="name"
                              class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              placeholder=""
                              bind:value={newInventoriedResource.name}
                              required
                              aria-invalid="true"
                              aria-describedby="name-error"
                            />
                          </div>
                        </div>
                      </div>
                      <div class="mt-4 text-left">
                        <div>
                          <label
                            for="stage"
                            class="block text-sm font-medium leading-6 text-gray-900"
                            >Resource Stage</label
                          >
                          <div class="relative mt-2 rounded-md shadow-sm">
                            <!-- option from process specifications -->
                            <select
                              id="stage"
                              name="stage"
                              class="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              value={newInventoriedResource.stage}
                              on:change={(e) => {
                                newInventoriedResource.stage = e.target.value
                              }}
                              >
                              {#each $allProcessSpecifications as pSpec}
                                <option value={pSpec?.id}>{pSpec?.name}</option>
                              {/each}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div class="mt-4 text-left">
                        <div>
                          <label
                            for="trackingIdentifier"
                            class="block text-sm font-medium leading-6 text-gray-900"
                            >Resource Tracking Identifier</label
                          >
                          <div class="relative mt-2 rounded-md shadow-sm">
                            <input
                              type="text"
                              name="trackingIdentifier"
                              id="trackingIdentifier"
                              class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              placeholder=""
                              bind:value={newInventoriedResource.trackingIdentifier}
                              required
                              aria-invalid="true"
                              aria-describedby="name-error"
                            />
                          </div>
                        </div>
                      </div>
                      <div class="mt-4 text-left">
                        <div class="col-span-full">
                          <label
                            for="note"
                            class="block text-sm font-medium leading-6 text-gray-900"
                            >Resource Description</label
                          >
                          <div class="mt-2">
                            <textarea
                              id="note"
                              name="note"
                              rows="3"
                              class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              bind:value={newInventoriedResource.note}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  {/if}
                </div> <!-- end right side -->
              </div> <!-- end outer -->
          </div>
        </div>
        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          {#if selectedCommitmentId}
          <button
          type="button"
          class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
          on:click={() => {
            console.log("selected commitment", selectedEvent)
            let newEvent = {...selectedEvent}
            if (!selectedEvent.provider) {
              newEvent.provider = newEvent.provider
            }
            if (!selectedEvent.providerId) {
              newEvent.providerId = newEvent.providerId
            }
            if (!selectedEvent.receiver) {
              newEvent.receiver = newEvent.receiver
            }
            if (!selectedEvent.resourceConformsTo) {
              newEvent.resourceConformsTo = newEvent.resourceConformsTo
            }
            if (!selectedEvent.resourceQuantity) {
              newEvent.resourceQuantity = newEvent.resourceQuantity
            }
            if (!selectedEvent.action) {
              newEvent.action = newEvent.action
            }
            if (!selectedEvent.note) {
              newEvent.note = newEvent.note
            }

            // newEvent.finished = selectedEvent.finished
            console.log("selected commitment2 ", selectedEvent)

            dispatch('submit', {
              column: commitmentModalColumn,
              process: commitmentModalProcess,
              side: commitmentModalSide,
              event: newEvent,
              useAs: 'update'
            });
            open = false;
          }}
          >Add Event</button>
          {:else}
          <button
            type="button"
            class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
            disabled={!isValid}
            on:click={() => {
                console.log(newEvent)
                dispatch('submit', {
                  column: commitmentModalColumn,
                  process: commitmentModalProcess,
                  side: commitmentModalSide,
                  resource: newInventoriedResource,
                  event: {
                    ...newEvent,
                    id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
                  },
                  useAs: 'new'
                });
              open = false
            }}
          >
            Add
          </button>
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
