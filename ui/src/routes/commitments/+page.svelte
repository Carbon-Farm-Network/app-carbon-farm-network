<script lang="ts">
import Header from "$lib/Header.svelte";
import Loading from "$lib/Loading.svelte";
import AgreementModal from "./AgreementModal.svelte";
import SvgIcon from "$lib/SvgIcon.svelte";
import { getAllCommitments, getAllUnits, getAllAgreements, getAllActions, getAllAgents, getAllResourceSpecifications } from "../../crud/fetch";
import { createCommitment, createAgreement, updateCommitment, updateAgreement, deleteCommitment, deleteAgreement } from "../../crud/commit";
import { allCommitments, allUnits, allAgreements, allActions, allAgents, allResourceSpecifications } from "../../crud/store";
import { cloneDeep } from "lodash";
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
let fetching: boolean = false;
let agreementModalOpen: boolean = false;
let currentAgreement: any;
let currentCommitment: any;
let currentReciprocalCommitment: any;

async function refresh() {
  fetching = true;
  await getAllAgreements();
  fetching = false;
}

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
<AgreementModal 
  bind:open={agreementModalOpen}
  bind:agreement={currentAgreement}
  bind:commitment={currentCommitment}
  bind:reciprocalCommitment={currentReciprocalCommitment}
  on:add={async (data) => {
    console.log("data", data.detail);
    const createdAgreement = await createAgreement(data.detail.agreement);
    await createCommitment({
      ...data.detail.commitment,
      action: data.detail.commitment.action.id,
      resourceConformsTo: data.detail.commitment.resourceConformsTo.id,
      provider: data.detail.commitment.provider.id,
      receiver: data.detail.commitment.receiver.id,
      clauseOf: createdAgreement.id
    });
    await createCommitment({
      ...data.detail.reciprocalCommitment,
      action: data.detail.reciprocalCommitment.action.id,
      resourceConformsTo: data.detail.reciprocalCommitment.resourceConformsTo.id,
      provider: data.detail.reciprocalCommitment.provider.id,
      receiver: data.detail.reciprocalCommitment.receiver.id,
      clauseOf: createdAgreement.id
    });
    refresh();
    agreementModalOpen = false;
  }}
  on:update={async (data) => {
    console.log("data", data.detail);
    // await updateAgreement(data.detail.agreement);
    await updateCommitment({
      ...data.detail.commitment,
      clauseOf: data.detail.agreement.id,
      action: data.detail.commitment.action.id,
      resourceConformsTo: data.detail.commitment.resourceConformsTo.id,
      provider: data.detail.commitment.provider.id,
      receiver: data.detail.commitment.receiver.id,
    });
    await updateCommitment({
      ...data.detail.reciprocalCommitment,
      clauseOf: data.detail.agreement.id,
      action: data.detail.reciprocalCommitment.action.id,
      resourceConformsTo: data.detail.reciprocalCommitment.resourceConformsTo.id,
      provider: data.detail.reciprocalCommitment.provider.id,
      receiver: data.detail.reciprocalCommitment.receiver.id,
    });
    refresh();
    agreementModalOpen = false;
  }}
/>

{#if loading}
  <Loading />
{/if}

<div class="p-12">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
      </div>

      <!-- refresh button -->
      <div class="mt-4 sm:ml-4 sm:mt-0 sm:flex-none">
        <button
        type="button"
        disabled={fetching}
        on:click={refresh}
        class="flex items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <span class="flex items-center" class:animate-spin={fetching}>
            <SvgIcon icon="faRefresh" color="#fff" />
          </span>
        </button>
      </div>

      <!-- add economic event with modal -->
      <div class="mt-4 sm:ml-3 sm:mt-0 sm:flex-none">
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
                  
                  <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                    <span class="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
                <!-- {agreements} -->
                {#each agreements as agreement}
                {@const commitment = agreement?.commitments?.[1]}
                {@const reciprocal = agreement?.commitments?.[0]}
                <tbody class="bg-white">

                    <tr class="bg-gray-100">
                      <!-- PRIMARY COMMITMENT -->
                      <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
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

                      <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3">
                        <button
                          type="button"
                          class="text-indigo-600 hover:text-indigo-900"
                          on:click={() => {
                            currentAgreement = cloneDeep(agreement);
                            currentCommitment = cloneDeep(commitment);
                            currentReciprocalCommitment = cloneDeep(reciprocal);
                            agreementModalOpen = true;
                          }}
                        >
                          Edit
                        </button>
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
                      
                      <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3">
                        <button
                          type="button"
                          class="text-indigo-600 hover:text-indigo-900"
                          on:click={async () => {
                            const confirmation = confirm("Are you sure you want to delete this exchange?");
                            if (!confirmation) return;
                            await deleteAgreement(agreement.id);
                            await deleteCommitment(commitment.id);
                            await deleteCommitment(reciprocal.id);
                            refresh();
                          }}
                        >
                          Delete
                        </button>
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