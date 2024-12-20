<script lang="ts">
    import { clickOutside } from '../../utils'
    import { onMount } from 'svelte'
    import { createEventDispatcher } from 'svelte';
    import { updateEconomicResource } from '../../crud/commit'
    import type { EconomicResource, ProcessSpecification } from '@leosprograms/vf-graphql';

    const dispatch = createEventDispatcher();

    export let open = false
    export let economicResource: EconomicResource | undefined = undefined
    export let units = undefined
    export let processSpecifications: ProcessSpecification[] | undefined = undefined

    // let stageId = economicResource?.stageId
    // let trackingIdentifier = economicResource?.trackingIdentifier
    // let name = economicResource?.name
    let note = economicResource?.note

    function saveEconomicResource() {
      if (!note) {return;}
      updateEconomicResource({
        revisionId: economicResource?.revisionId,
        note,
        // name,
        // stageId,
        // trackingIdentifier
      })
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
                Economic Resource
              </h3>


                <div class="mt-4 text-left">
                    <div>
                        <label
                            for="provider"
                            class="block text-sm font-medium leading-6 text-gray-900"
                            >Name</label
                        >
                        {economicResource?.name}
                        <!-- <input
                            id="name"
                            name="name"
                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            bind:value={name}
                        /> -->
                    </div>
                    <div>
                      <label
                          for="note"
                          class="block text-sm font-medium leading-6 text-gray-900"
                          >Note</label
                      >
                      <input
                          id="note"
                          name="note"
                          class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          value={economicResource?.note}
                          on:change={(e) => note = e.target.value}
                      />
                    </div>
                    <div>
                        <label
                            for="provider"
                            class="block text-sm font-medium leading-6 text-gray-900"
                            >Stage</label
                        >
                        {processSpecifications?.find(p => p.id === economicResource?.stageId)?.name}
                    </div>
                    <div>
                        <label
                            for="ptracking identifier"
                            class="block text-sm font-medium leading-6 text-gray-900"
                            >Tracking Identifier</label
                        >
                        {economicResource?.trackingIdentifier}
                        <!-- <input
                          id="note"
                          name="note"
                          class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          bind:value={trackingIdentifier}
                        /> -->
                    </div>
                    <div>
                        <label
                            for="provider"
                            class="block text-sm font-medium leading-6 text-gray-900"
                            >Accounting Quantity</label
                        >
                        {economicResource?.accountingQuantity.hasNumericalValue} {units?.find(u => u.id === economicResource?.accountingQuantity.hasUnitId)?.label}
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            on:click={() => (open = false)}
            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
            >Cancel</button
            >
            <!-- submit -->
            <button
            type="button"
            on:click={() => {
              saveEconomicResource()
              dispatch('submit', { economicResource })
            }}
              class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
              >Save
            </button>
          </div>
        </div>
    </div>
    </div>
</div>