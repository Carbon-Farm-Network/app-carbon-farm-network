<script lang="ts">
import Header from "$lib/Header.svelte";
import Loading from "$lib/Loading.svelte";
import AgreementModal from "./AgreementModal.svelte";
import { getAllCommitments, getAllUnits, getAllAgreements, getAllActions, getAllAgents, getAllResourceSpecifications } from "../../crud/fetch";
import { allCommitments, allUnits, allAgreements, allActions, allAgents, allResourceSpecifications } from "../../crud/store";
import { onMount } from "svelte";

let units: any = [];
allUnits.subscribe(value => {
  units = value;
});

let actions: any = [];
allActions.subscribe(value => {
  actions = value;
});

let agents: any = [];
allAgents.subscribe(value => {
  agents = value;
});

let resourceSpecifications: any = [];
allResourceSpecifications.subscribe(value => {
  resourceSpecifications = value;
});

let agreements: any = [];
allAgreements.subscribe(value => {
  agreements = value;
});

// let commitments: Commitment[] = [];
// allCommitments.subscribe(value => {
//   commitments = value;
// });

let loading: boolean = false;
let agreementModalOpen: boolean = false;

onMount(async () => {
  loading = agreements.length === 0;
  console.log("loading", agreements.length, loading);

  let functions = [
    { array: actions, func: getAllActions },
    { array: units, func: getAllUnits },
    { array: agents, func: getAllAgents },
    { array: resourceSpecifications, func: getAllResourceSpecifications },
  ];

  for (let item of functions) {
    if (item.array.length === 0) {
      await item.func();
    }
  }

  await getAllAgreements();
  console.log("agreements", agreements);
  loading = false;
});
</script>

<Header title="Exchanges" description="The exchanges in a network." />
<AgreementModal bind:open={agreementModalOpen}/>

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
            agreementModalOpen = true;
          }}
          class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >Add an exchange</button>
      </div>
    </div>
    <div class="mt-8 flow-root">
        <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table class="min-w-full divide-y divide-gray-300">
              <thead>
                <!-- <tr>
                  <th
                    scope="col"
                    class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                    >Primary</th
                  >
                  <th
                    scope="col"
                    class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                    ></th
                  >
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >Reciprocal</th
                  >
                  <th
                    scope="col"
                    class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                    ></th
                  >
                </tr> -->
                <tr>
                  <th
                    scope="col"
                    class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                    >Action</th
                  >
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >Quantity</th
                  >
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >Resource</th
                  >
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >From</th
                  >
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >To</th
                  >
                  
                  <!-- <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                    <span class="sr-only">Edit</span>
                  </th> -->
                </tr>
              </thead>
                <!-- {agreements} -->
                {#each agreements as agreement}
                {@const commitment = agreement.commitments[1]}
                {@const reciprocal = agreement.commitments[0]}
                <tbody class="bg-white">

                    <tr class="bg-gray-100">
                      <!-- PRIMARY COMMITMENT -->
                      <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agreement?.commitments?.length}
                        {commitment?.action?.label}
                      </td>
                      <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {commitment?.resourceQuantity?.hasNumericalValue.toFixed(2).replace(/\.?00+$/, '')}
                        <!-- {units.find(unit => unit.id === commitment.resourceQuantity.hasUnitId)?.label} -->
                      </td>
                      <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {commitment?.resourceConformsTo?.name}
                      </td>
                      <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {commitment?.provider?.name}
                      </td>
                      <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {commitment?.receiver?.name}
                      </td>
                    </tr>

                    <tr class="bg-gray-100">
                      <!-- RECIPROCAL COMMITMENT -->
                      <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reciprocal?.action?.label}
                      </td>
                      <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reciprocal?.resourceQuantity?.hasNumericalValue.toFixed(2).replace(/\.?00+$/, '')}
                        <!-- {units.find(unit => unit.id === reciprocal.resourceQuantity.hasUnitId)?.label} -->
                      </td>
                      <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reciprocal?.resourceConformsTo?.name}
                      </td>
                      <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reciprocal?.provider?.name}
                      </td>
                      <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reciprocal?.receiver?.name}
                      </td>
                    </tr>
                  </tbody>

                  <tr>
                    <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    </td>
                  </tr>
                {/each}
            </table>
          </div>
        </div>
    </div>          
</div>