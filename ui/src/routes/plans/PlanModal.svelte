<script lang="ts">
  import { clickOutside } from '../../utils';
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import type {
    Unit,
    PlanUpdateParams,
    PlanCreateParams
  } from '@valueflows/vf-graphql';
  import {
    createPlan,
    updatePlan,
    createProcess,
    createCommitment,
    createAgreement
  } from '../../crud/commit';

  export let open = false;
  export let planObject: PlanUpdateParams | PlanCreateParams;
  export let editing: boolean = false;

  // Data used only on create
  export let commitments: any[] = [];
  export let allColumns: any[][] = [];
  export let units: Unit[] = [];
  export let agents: any[] = [];
  export let resourceSpecifications: any[] = [];

  let savingPlan = false;
  let error: any;
  const dispatch = createEventDispatcher();

  const checkKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !e.shiftKey) {
      e.preventDefault();
      open = false;
    }
  };

  onMount(() => {
    window.addEventListener('keydown', checkKey);
    return () => window.removeEventListener('keydown', checkKey);
  });

  // Save only the Plan (create or update)
  async function savePlan() {
    if (editing) {
      const params: PlanUpdateParams = {
        revisionId: (planObject as PlanUpdateParams).revisionId,
        name: planObject.name,
        note: planObject.note
      };
      return updatePlan(params);
    } else {
      const params: PlanCreateParams = {
        name: planObject.name || `New Plan ${new Date().toLocaleString()}`,
        note: planObject.note,
        created: Date.now(),
        due: Date.now()
      };
      return createPlan(params);
    }
  }

  // Create-only helpers (no updates or deletions here)
  async function handleCreateFlow(planId: string) {
    console.log('Creating flow for plan:', planId);
    console.log('Commitments:', commitments);
    // Independent demands
    const networkAgent = agents.find(a => a.classifiedAs[2] === 'Network')?.id;
    for (const d of commitments) {
      const payload = {
        ...d,
        plannedWithin: planId,
        independentDemandOf: planId,
        provider: networkAgent,
        action: d.action.id,
        receiver: d.receiver.id || networkAgent,
        resourceConformsTo: d.resourceConformsTo.id,
        resourceQuantity: {
          hasNumericalValue: Number(d.resourceQuantity?.hasNumericalValue),
          hasUnit: d.resourceQuantity.hasUnit?.id
        },
        availableQuantity: {
          hasNumericalValue: Number(d.availableQuantity?.hasNumericalValue),
          hasUnit: d.availableQuantity.hasUnit?.id
        }
      }
      console.log('Creating independent demand:', payload);
      const res = await createCommitment(payload);
      console.log('Created independent demand commitment:', res);
    }

    // Processes and their commitments
    for (const column of allColumns) {
      for (const proc of column) {
        // always create new process
        console.log('Creating process:', proc);
        const { id: procId } = await createProcess({
          name: proc.name,
          note: proc.note,
          plannedWithin: planId,
          basedOn: proc.basedOn?.id
        });

        console.log('Created process with ID:', procId);

        // commit inputs and outputs
        const items = [
          ...proc.committedInputs.map(i => ({ ...i, inputOf: procId })),
          ...proc.committedOutputs.map(o => ({ ...o, outputOf: procId }))
        ];

        console.log('Creating commitments for process:', procId, items);
        for (const c of items) {
          // create agreement if needed
          if (c.agreement) {
            const { id: agId } = await createAgreement({
              name: c.agreement.name,
              note: c.agreement.note
            });
            c.clauseOf = agId;
            console.log("THERE IS A CLAUSE OF", c.agreement);

            const reciprocalPayload = {
              action: c.agreement.commitment.action,
              clauseOf: agId,
              provider: c.agreement.commitment?.provider?.id || c.receiver?.id || networkAgent,
              receiver: c.agreement.commitment?.receiver?.id || c.provider?.id || networkAgent,
              resourceConformsTo: c.agreement.commitment?.resourceConformsTo?.id,
              resourceQuantity: {
                hasNumericalValue: Number(c.agreement.commitment?.resourceQuantity?.hasNumericalValue),
                hasUnit: c.agreement.commitment?.resourceQuantity?.hasUnit?.id
              },
            }
            console.log('Creating reciprocal commitment:', reciprocalPayload);
            const reciprocalCommitmentRes = await createCommitment(reciprocalPayload)

            console.log('Created reciprocal commitment:', reciprocalCommitmentRes);
          }

          // ensure unit id
          // const unitId =
          //   c.resourceQuantity.hasUnit?.id ||
          //   units.find(u => u.label === c.resourceQuantity.hasUnit.label)?.id;

          const newCommitmentRes = await createCommitment({
            ...c,
            plannedWithin: planId,
            resourceQuantity: {
              hasNumericalValue: Number(c.resourceQuantity.hasNumericalValue),
              hasUnit: c.resourceQuantity.hasUnit?.id
            },
            availableQuantity: {
              hasNumericalValue: Number(c.availableQuantity?.hasNumericalValue),
              hasUnit: c.availableQuantity?.hasUnit?.id || c.resourceQuantity.hasUnit?.id
            },
            action: c.action.id,
            provider: (c.provider?.id || c.provider) || networkAgent,
            receiver: (c.receiver?.id || c.receiver) || networkAgent,
            resourceConformsTo: c.resourceConformsTo?.id,
            stage: c.stage?.id || c.stage,
          });

          console.log('Created commitment:', newCommitmentRes?.clauseOf);
        }
      }
    }
  }

  async function handleSave() {
    savingPlan = true;
    error = null;

    try {
      const res = await savePlan();
      console.log('Plan saved:', res);
      const planId = res.id;

      if (!editing) {
        await handleCreateFlow(planId);
      }

      dispatch('saved', planId);
      goto(`/plans/update/${encodeURIComponent(planId)}`);
      open = false;
    } catch (e) {
      error = e;
    } finally {
      savingPlan = false;
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
      <div use:clickOutside on:outclick={() => (open = false)}>
        {#if !savingPlan}
          <div 
          class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
          >
            <div class="mt-3 text-center sm:mt-5">
              <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                {editing ? 'Update Plan' : 'Create Plan'}
              </h3>
            </div>

            <div class="mt-4">
              <label for="name" class="block text-sm font-medium">Name</label>
              <input
                id="name"
                bind:value={planObject.name}
                required
                class="mt-1 block w-full rounded-md border-gray-300"
              />
            </div>

            <div class="mt-4">
              <label for="note" class="block text-sm font-medium">Description</label>
              <textarea
                id="note"
                bind:value={planObject.note}
                rows="3"
                class="mt-1 block w-full rounded-md border-gray-300"
              />
            </div>

            <div class="mt-6 flex justify-end space-x-3">
              <button
              class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
              on:click={() => (open = false)}
              >
              Cancel
            </button>
            <button
              class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
              on:click={handleSave}
            >
              Save
            </button>
            </div>
          </div>
        {:else}
          <div class="p-6 bg-white rounded-lg shadow-lg text-center">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <!-- <div
                class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10"
              > -->
              <svg width="50" height="50" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="black" stroke-dasharray="31.415, 31.415" />
              </svg>
              <!-- </div> -->
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3
                  class="text-lg leading-6 font-medium text-gray-900"
                  id="modal-headline"
                >
                  Saving plan...
                </h3>
                <!-- <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    {#if commitmentsSavedCount > -1}
                      saved {commitmentsSavedCount} of {commitmentsToSaveCount} commitments
                    {/if}
                  </p>
                </div> -->
                {#if error}
                  <div class="mt-2">
                    Error:
                    {JSON.stringify(error)}
                  </div>
                {/if}
              </div>
            </div>
          </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>