<script lang="ts">
import { onMount } from "svelte";
import Header from "$lib/Header.svelte";
import UnitModal from "./UnitModal.svelte";
import Loading from "$lib/Loading.svelte";
import Export from "$lib/Export.svelte";
import type { Unit } from "@leosprograms/vf-graphql";
import { getAllUnits } from "../../crud/fetch";
import { allUnits } from "../../crud/store";
  import { importUnits } from "../../crud/import"

let units: Unit[] = [];
allUnits.subscribe(value => {
    units = value;
});

let selectedUnit: Unit | undefined = undefined;
let modalOpen = false;
let loading = false;
let editing = false;
let exportOpen = false;
let importing = false;
$: selectedUnit, modalOpen, units;

onMount(async () => {
    let loading = units.length === 0;
    await getAllUnits();
    loading = false;
});

</script>

<Header title="Units" description="The units in a network." />
<UnitModal bind:open={modalOpen} unit={selectedUnit} bind:editing on:close={() => modalOpen = false} 
    on:submit={() => {
        modalOpen = false;
    }} />

{#if loading}
<Loading />
{/if}

<div class="p-12">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
      </div>
      <!-- add economic event with modal -->
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button
          type="button"
          on:click={() => {
            selectedUnit = {
              label: "",
              symbol: "",
              omUnitIdentifier: "",
            };
            editing = false;
            modalOpen = true;
          }}
          class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >Add a unit</button>
        </div>
        <Export bind:importing bind:open={exportOpen} dataName="list of Units" fileName="cfn-units" data={units}
          on:import={async (event) => {
              await importUnits(event.detail);
              await getAllUnits();
              importing = false;
              exportOpen = false;
          }}
        />
    </div>
    <div class="mt-8 flow-root">
        <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table class="min-w-full divide-y divide-gray-300">
                <thead>
                    <tr>
                        <th
                            scope="col"
                            class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                            >Label</th
                        >
                        <th
                            scope="col"
                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >Symbol</th
                        >
                        <th
                            scope="col"
                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >OM Unit Identifier</th
                        >
                        <!-- edit -->
                        <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"></th>
                    </tr>
                </thead>
                <tbody>
                    {#each units as unit, index}
                    <tr class="{index % 2 == 0 ? 'bg-gray-100': ''}">
                        <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3">{unit.label}</td>
                        <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3">{unit.symbol}</td>
                        <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3">{unit.omUnitIdentifier}</td>
                        <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3">
                            <button type="button" on:click={() => {
                                selectedUnit = {...unit};
                                editing = true;
                                modalOpen = true;
                            }}
                                class="text-indigo-600 hover:text-indigo-900"
                            >
                                Edit
                                <span class="sr-only">, Lindsay Walton</span>
                            </button>
                        </td>
                    </tr>
                    {/each}
                </tbody>
            </table>
            </div>
        </div>
    </div>
</div>
