<script lang="ts">
    import { clickOutside } from '../../utils'
    import { onMount } from 'svelte'
    import { createEventDispatcher } from 'svelte';
    import type { AgentConnection, Agent, UnitConnection, Action } from '@leosprograms/vf-graphql'
    import { allAgents, allUnits, allResourceSpecifications, allActions } from '../../crud/store';
    import { cloneDeep } from "lodash"
    export let open = false
    export let agreement: any;
    export let commitment: any;
    export let reciprocalCommitment: any;

    const dispatch = createEventDispatcher()

    function resetForm() {
        commitment = cloneDeep(newCommitmentTemplate)
        reciprocalCommitment = cloneDeep(newCommitmentTemplate)
        agreement = {
            name: '',
            note: '',
        }
    }

    function checkKey(e: any) {
        if (e.key === 'Escape' && !e.shiftKey) {
            e.preventDefault()
            resetForm()
            open = false
        }
    }

    const newCommitmentTemplate = {
        id: undefined,
        revisionId: undefined,
        resourceConformsTo: {
            id: '',
        },
        action: {
            id: '',
            label: ''
        },
        resourceQuantity: {
            hasNumericalValue: 0,
            hasUnit: {
                id: ''
            }
        },
        receiver: {
            id: ''
        },
        provider: {
            id: ''
        },
        note: '',
        finished: false
    }

    onMount(() => {
        if (!commitment) {
            resetForm()
        }

        window.addEventListener('keydown', checkKey)
        return () => {
            window.removeEventListener('keydown', checkKey)
        }
    })

</script>

{#if commitment && reciprocalCommitment}
<div class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true" >
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
      class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ease-out duration-300 ease-in duration-200"
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
                                {agreement?.revisionId ? 'Update' : 'Add'}
                                Exchange
                            </h3>
                        </div>
                        <!-- <div class="mt-3 text-center sm:mt-5">
                            <div class="text-left">
                                <label
                                  for="name"
                                  class="block text-sm font-medium leading-6 text-gray-900">Name</label
                                >
                                <div class="relative mt-2 rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        placeholder=""
                                        required
                                        aria-invalid="true"
                                        aria-describedby="name-error"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 text-center sm:mt-5">
                            <div class="text-left">
                                <label
                                  for="note"
                                  class="block text-sm font-medium leading-6 text-gray-900">Note</label
                                >
                                <div class="relative mt-2 rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        name="note"
                                        id="name"
                                        class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        placeholder=""
                                        required
                                        aria-invalid="true"
                                        aria-describedby="note-error"
                                    />
                                </div>
                            </div>
                        </div> -->
                        <div class="mt-3 text-center sm:mt-5">
                            <h3 class="text-base font-semibold leading-6 text-gray-400" id="modal-title">
                                Primary Commitment
                            </h3>
                            <div class="mt-4 text-left">
                                <div>
                                    <label
                                        for="provider"
                                        class="block text-sm font-medium leading-6 text-gray-900"
                                    >
                                        Provider
                                    </label>
                                    <select
                                        id="provider"
                                        name="provider"
                                        class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        value={commitment.provider.id}
                                        on:change={(e) => {
                                            commitment.provider.id = e.target.value
                                            reciprocalCommitment.receiver.id = e.target.value
                                        }}
                                    >
                                        <option value={undefined}></option>
                                        {#each $allAgents as agent}
                                            <option value={agent.id}>{agent.name}</option>
                                        {/each}
                                    </select>
                                </div>
                            </div>
                            <div class="mt-4 text-left">
                                <div>
                                    <label
                                        for="defaultUnitOfResource"
                                        class="block text-sm font-medium leading-6 text-gray-900"
                                    >
                                        Resource specification
                                    </label>
                                    <select
                                        id="defaultUnitOfResource"
                                        name="defaultUnitOfResource"
                                        class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        value={commitment.resourceConformsTo.id}
                                        on:change={(e) => {
                                            commitment.resourceConformsTo.id = e.target.value
                                            // change unit
                                            commitment.resourceQuantity.hasUnit.id = $allResourceSpecifications.find(rs => rs.id === e.target.value).defaultUnitOfResource.id
                                        }}
                                    >
                                        <option value={undefined}></option>
                                        {#each $allResourceSpecifications as resourceSpecification}
                                            <option value={resourceSpecification.id}>{resourceSpecification.name}</option>
                                        {/each}
                                    </select>
                                </div>
                            </div>
                            <div class="mt-4 text-left">
                                <div>
                                    <label
                                        for="action"
                                        class="block text-sm font-medium leading-6 text-gray-900"
                                        >Action</label
                                    >
                                    <select
                                        id="action"
                                        name="action"
                                        class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        value={commitment.action.id}
                                        on:change={(e) => {
                                            commitment.action.id = e.target.value
                                        }}
                                    >
                                        <option value={undefined}></option>
                                        {#each $allActions as action}
                                            <option value={action.id}>{action.label}</option>
                                        {/each}
                                    </select>
                                </div>
                            </div>
                            <div class="mt-4 text-left flex justify-between items-center">
                                <div class="text-left w-1/2 pr-2">
                                    <label
                                        for="name"
                                        class="block text-sm font-medium leading-6 text-gray-900"
                                        >Quantity</label
                                    >
                                    <div class="relative mt-2 rounded-md shadow-sm">
                                        <input
                                            type="number"
                                            name="quantity"
                                            id="quantity"
                                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            placeholder="0"
                                            value={commitment.resourceQuantity.hasNumericalValue}
                                            on:change={(e) => {
                                                commitment.resourceQuantity.hasNumericalValue = Number(e.target.value)
                                            }}
                                            min=0
                                            required
                                            aria-invalid="true"
                                            aria-describedby="name-error"
                                        />
                                    </div>
                                </div>

                                <div class="text-left w-1/4 pl-2">
                                    <label
                                        for="unit"
                                        class="block text-sm font-medium leading-6 text-gray-900">Unit</label
                                    >
                                    <select
                                        id="unit"
                                        name="unit"
                                        class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        value={commitment.resourceQuantity.hasUnit.id}
                                        on:change={(e) => {
                                            commitment.resourceQuantity.hasUnit.id = e.target.value
                                        }}
                                    >
                                        <option value={undefined}></option>
                                        {#each $allUnits as unit}
                                            <option value={unit.id}>{unit.label}</option>
                                        {/each}
                                    </select>
                                </div>
                            </div>
                        </div>
                    <div class="mt-3 text-center sm:mt-5">
                        <h3 class="text-base font-semibold leading-6 text-gray-400" id="modal-title">
                            Reciprocal Commitment
                        </h3>
                    </div>
                    <div class="mt-4 text-left">
                        <div>
                            <label
                                for="provider"
                                class="block text-sm font-medium leading-6 text-gray-900"
                                >Provider
                            </label>
                            <select
                                id="provider"
                                name="provider"
                                class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                value={reciprocalCommitment.provider.id}
                                on:change={(e) => {
                                    reciprocalCommitment.provider.id = e.target.value
                                    commitment.receiver.id = e.target.value
                                }}
                            >
                                <option value={undefined}></option>
                                {#each $allAgents as agent}
                                    <option value={agent.id}>{agent.name}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                    <div class="mt-4 text-left">
                        <div>
                            <label
                                for="defaultUnitOfResource"
                                class="block text-sm font-medium leading-6 text-gray-900"
                            >
                                Resource specification
                            </label>
                            <select
                                id="defaultUnitOfResource"
                                name="defaultUnitOfResource"
                                class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                value={reciprocalCommitment.resourceConformsTo.id}
                                on:change={(e) => {
                                    reciprocalCommitment.resourceConformsTo.id = e.target.value
                                    // change unit
                                    reciprocalCommitment.resourceQuantity.hasUnit.id = $allResourceSpecifications.find(rs => rs.id === e.target.value).defaultUnitOfResource.id
                                }}
                            >
                                <option value={undefined}></option>
                                {#each $allResourceSpecifications as resourceSpecification}
                                    <option value={resourceSpecification.id}>{resourceSpecification.name}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                    <div class="mt-4 text-left">
                        <div>
                          <label
                            for="action"
                            class="block text-sm font-medium leading-6 text-gray-900"
                            >Action</label
                          >
                            <select
                                id="action"
                                name="action"
                                class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                value={reciprocalCommitment.action.id}
                                on:change={(e) => {
                                    reciprocalCommitment.action.id = e.target.value
                                }}
                            >
                                <option value={undefined}></option>
                                {#each $allActions as action}
                                    <option value={action.id}>{action.label}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                    
                    <div class="mt-4 text-left flex justify-between items-center">
                        <div class="text-left w-1/2 pr-2">
                            <label
                                for="name"
                                class="block text-sm font-medium leading-6 text-gray-900"
                                >Quantity</label
                            >
                            <div class="relative mt-2 rounded-md shadow-sm">
                                <input
                                    type="number"
                                    name="quantity"
                                    id="quantity"
                                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    placeholder="0"
                                    value={reciprocalCommitment.resourceQuantity.hasNumericalValue}
                                    on:change={(e) => {
                                        reciprocalCommitment.resourceQuantity.hasNumericalValue = Number(e.target.value)
                                    }}
                                    min=0
                                    required
                                    aria-invalid="true"
                                    aria-describedby="name-error"
                                />
                            </div>
                        </div>

                        <div class="text-left w-1/4 pl-2">
                            <label
                                for="unit"
                                class="block text-sm font-medium leading-6 text-gray-900">Unit</label
                            >
                            <select
                                id="unit"
                                name="unit"
                                class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                value={reciprocalCommitment.resourceQuantity.hasUnit.id}
                                on:change={(e) => {
                                    reciprocalCommitment.resourceQuantity.hasUnit.id = e.target.value
                                }}
                            >
                                <option value={undefined}></option>
                                {#each $allUnits as unit}
                                    <option value={unit.id}>{unit.label}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                </div>
                <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    {#if agreement?.revisionId}
                        <button
                            type="button"
                            class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                            on:click={() => {
                                dispatch('update', {agreement, commitment, reciprocalCommitment})
                                resetForm()
                                open = false
                            }}
                        >
                            Update
                        </button>
                    {:else}
                        <button
                            type="button"
                            class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                            on:click={() => {
                                dispatch('add', {agreement, commitment, reciprocalCommitment})
                                resetForm()
                                open = false
                            }}
                        >
                            Add
                        </button>
                    {/if}

                    <button
                        type="button"
                        on:click={() => {
                            resetForm()
                            open = false
                        }}
                        class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"

                        >Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
{/if}