<script lang="ts">
  import { allUnits } from "../../../../crud/store";
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";

  export let open = false;
  export let currentColumn: any = {};
  export let backwardSuggestions: any[] = [];

  const dispatch = createEventDispatcher();

  let units: any[] = [];
  allUnits.subscribe((value) => {
    units = value;
  });

  onMount(() => {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        open = false;
      }
    });
  });

//   async function submit() {
//     await forward(plan_id);
//     plan.update();
//     modal.update();
//     goto('/plans');
//   }
</script>
<!-- 
{#each backwardSuggestions as suggestion}
    <div>{JSON.stringify(suggestion)}</div>
{/each} -->


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
        >
          <div>
            <div class="mt-3 text-center sm:mt-5">
              <h3
                class="text-base font-semibold leading-6 text-gray-900"
                id="modal-title"
              >
                Plan backward
              </h3>
              <!-- <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Plan forward
                </p>
              </div> -->
            </div>
            </div>

            <div class="mt-5 sm:mt-6 flex justify-center">
                <div class="flex flex-col space-y-4 items-center">
                {#each backwardSuggestions.current || [] as backwardProcess, index}
                  {#each backwardProcess || [] as commitment}
                  <!-- suggestion -->
                   {@const suggestion = backwardSuggestions?.new[index]?.find(s => s.resourceConformsTo?.id === commitment.resourceConformsTo?.id)}
                    <div class="flex flex-col items-center justify-between w-full text-center">
                      <div>
                      {commitment.resourceConformsTo?.name}
                      </div>
                      <div>
                      {commitment.resourceQuantity?.hasNumericalValue} 
                      {units.find(u => u.id == commitment.resourceQuantity?.hasUnitId)?.symbol}
                       ➜
                      {suggestion?.resourceQuantity?.hasNumericalValue}
                      {units.find(u => u.id == suggestion?.resourceQuantity?.hasUnitId)?.symbol}
                      </div>
                    </div>
                  {/each}
                {/each}
                </div>
            </div>

            <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                on:click={() => (open = false)}
                class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                >Cancel</button
              >
              
              <button
                type="button"
                class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                on:click={() => {
                  dispatch("accept");
                  open = false;
                }}
              >
                Accept
              </button>
            </div>
        </div>
        </div>
        </div>
    </div>