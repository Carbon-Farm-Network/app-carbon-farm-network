<script lang="ts">
    import { clickOutside } from '../utils'
    import { onMount } from 'svelte'
    import { createEventDispatcher } from 'svelte';
    import { addUnit, updateUnit } from '../crud/commit'
    import type { Unit } from '@leosprograms/vf-graphql';
    import Papa from "papaparse";

    const dispatch = createEventDispatcher();

    export let open = false
    export let editing = false
    export let unit: Unit = {
        label: '',
        symbol: '',
        omUnitIdentifier: ''
    }

    let omUnits: any[] = []
    let suggestions: any[] = [];
    let showSuggestions = false;
    let isUnitValid = false

    $: isUnitValid = unit?.label?.length > 0 && unit?.symbol?.length > 0 && unit?.omUnitIdentifier?.length > 0

    async function getCSVContent() {
        const response = await fetch('../units.csv');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let file = await response.blob();
        const csv: any = await new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: function(results: any) {
                    resolve(results);
                },
                error: function(error: any) {
                    reject(error);
                }
            });
        });

        omUnits = csv.data;
    }

    function filterSuggestions() {
        const query = unit.label.toLowerCase();
        suggestions = omUnits.filter(omUnit => omUnit.chain_1.toLowerCase().includes(query));
        showSuggestions = suggestions.length > 0;
    }

    function selectSuggestion(suggestion: any) {
        unit.label = suggestion.chain_1;
        unit.symbol = suggestion.ch
        unit.omUnitIdentifier = suggestion.chain
        showSuggestions = false;
    }

    function checkKey(e: any) {
        if (e.key === 'Escape' && !e.shiftKey) {
            e.preventDefault()
            showSuggestions = false
            open = false
        }
    }

    onMount(async () => {
        window.addEventListener('keydown', checkKey)
        window.addEventListener('click', (e: any) => {
            if (!document.getElementById('name').contains(e.target)) {
                showSuggestions = false
            }
        })
        getCSVContent()
    })

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
                        Unit
                    </h3>
                    <div class="mt-4 text-left">
                        <div class="col-span-full">
                            <label
                                for="label"
                                class="block text-sm font-medium leading-6 text-gray-900"
                                >Label</label
                            >
                            <input
                                id="name"
                                name="name"
                                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                bind:value={unit.label}
                                on:input={filterSuggestions}
                            />
                            {#if showSuggestions}
                                <div class="suggestions">
                                    {#each suggestions as suggestion}
                                        <div class="suggestion-item" on:click={() => selectSuggestion(suggestion)}>
                                            {suggestion.chain_1}
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        <div class="mt-4 text-left">
                            <label
                                for="symbol"
                                class="block text-sm font-medium leading-6 text-gray-900"
                                >Symbol</label
                            >
                            <input
                                id="note"
                                name="note"
                                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                bind:value={unit.symbol}
                            />
                        </div>
                        <div class="mt-4 text-left">
                            <label
                                for="omUnitIdentifier"
                                class="block text-sm font-medium leading-6 text-gray-900"
                                >OM Unit Identifier</label
                            >
                            <input
                                id="omUnitIdentifier"
                                name="omUnitIdentifier"
                                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                bind:value={unit.omUnitIdentifier}
                            />
                        </div>
                    </div>
                </div>
                </div>
                <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                        type="button"
                        on:click={() => {
                            unit = {
                                label: '',
                                symbol: '',
                                omUnitIdentifier: ''
                            }
                            dispatch('close') 
                        }}
                        class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                        >Cancel</button
                    >
                    <button
                        type="button"
                        disabled={!isUnitValid}
                        class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                        on:click={async () => {
                            editing ? await updateUnit({ revisionId: unit.revisionId, label: unit.label, symbol: unit.symbol, omUnitIdentifier: unit.omUnitIdentifier }) :
                            await addUnit({ label: unit.label, symbol: unit.symbol, omUnitIdentifier: unit.omUnitIdentifier })
                            dispatch('submit')
                        }}
                        >
                        {editing ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .suggestions {
        border: 1px solid #ccc;
        border-top: none;
        max-height: 150px;
        overflow-y: auto;
        position: absolute;
        width: calc(100% - 48px);
        background: white;
        z-index: 1000;
    }
    .suggestion-item {
        padding: 8px;
        cursor: pointer;
    }
    .suggestion-item:hover {
        background-color: #f0f0f0;
    }
</style>