<script lang="ts">
  import recipes from '$lib/data/recipes.json'
  import requests from '$lib/data/requests.json'
  import { Decimal } from 'decimal.js'
  import PlanModal from '$lib/PlanModal.svelte'
  import CommitmentModal from '$lib/CommitmentModal.svelte'

  const previousColumn = column => {
    return column.reduce((acc, input) => {
      if (input.resource_quantity.has_numerical_value > 0) {
        // find a recipe that outputs what the demand wants
        const recipe = recipes.find(a_recipe => {
          if (input.stage) {
            return a_recipe.has_recipe_output.some(
              output =>
                output.resource_conforms_to.name == input.resource_conforms_to.name &&
                a_recipe.process_conforms_to.name == input.stage.name
            )
          } else {
            return a_recipe.has_recipe_output.some(
              output =>
                output.resource_conforms_to.name == input.resource_conforms_to.name
            )
          }
        })
        // if there is no recipe we just continue
        if (!recipe) return acc
        // find the output that matches the demand
        let matching_output = recipe.has_recipe_output.find(
          output => output.resource_conforms_to.name == input.resource_conforms_to.name
        )
        // find the multiplier to make the demand required
        // TODO round up not down like it is now
        // console.log(recipe, matching_output?.resource_quantity?.has_numerical_value)
        const multiplier = new Decimal(
          input.resource_quantity.has_numerical_value || '1'
        ).div(new Decimal(matching_output?.resource_quantity?.has_numerical_value))
        let matching_input = recipe.has_recipe_input.find(
          an_input =>
            an_input.resource_conforms_to.name == input.resource_conforms_to.name
        )
        matching_input = {
          ...matching_input,
          resource_quantity: {
            ...matching_input?.resource_quantity,
            has_numerical_value: multiplier
              .toDecimalPlaces(0, Decimal.ROUND_UP)
              .toString()
          }
        }
        matching_output = {
          ...matching_output,
          resource_quantity: {
            ...matching_output?.resource_quantity,
            has_numerical_value: multiplier
              .toDecimalPlaces(0, Decimal.ROUND_UP)
              .toString()
          }
        }
        let has_output, has_input, new_output, new_input
        if (matching_output?.action == 'dropoff' || matching_output?.action == 'modify') {
          const existing_process = acc.find(it => it.id == recipe.id)
          if (existing_process) {
            const remaining_processes = acc.filter(it => it.id != existing_process.id)
            const existing_services = existing_process.has_output.filter(
              output => output.action != 'dropoff' && output.action != 'modify'
            )
            const existing_output = existing_process.has_output.find(
              output => output.id == matching_output.id
            )
            if (existing_output) {
              new_output = {
                ...existing_output,
                resource_quantity: {
                  ...existing_output.resource_quantity,
                  has_numerical_value: new Decimal(
                    existing_output.resource_quantity.has_numerical_value
                  ).add(matching_output.resource_quantity.has_numerical_value)
                }
              }
            } else {
              new_output = matching_output
            }

            const existing_input = existing_process.has_input.find(
              input => input.id == matching_input.id
            )
            if (existing_input) {
              new_input = {
                ...existing_input,
                resource_quantity: {
                  ...existing_input.resource_quantity,
                  has_numerical_value: new Decimal(
                    existing_input.resource_quantity.has_numerical_value
                  ).add(matching_input.resource_quantity.has_numerical_value)
                }
              }
            } else {
              new_input = matching_input
            }
            const updated_services = existing_services.map(service => ({
              ...service,
              resource_quantity: {
                ...service.resource_quantity,
                has_numerical_value: new Decimal(
                  service.resource_quantity.has_numerical_value
                ).add(matching_output.resource_quantity.has_numerical_value)
              }
            }))
            const non_service_non_matching_outputs = existing_process.has_output.filter(
              previous_output =>
                previous_output.id != matching_output.id &&
                (previous_output.action == 'dropoff' ||
                  previous_output.action == 'modify')
            )
            const non_matching_inputs = existing_process.has_input.filter(
              previous_input => previous_input.id != matching_input.id
            )
            return [
              ...remaining_processes,
              {
                ...existing_process,
                has_output: [
                  ...non_service_non_matching_outputs,
                  ...updated_services,
                  new_output
                ],
                has_input: [...non_matching_inputs, new_input]
              }
            ]
          } else {
            const services = recipe.has_recipe_output.filter(
              output => output.action != 'dropoff' && output.action != 'modify'
            )
            has_input = [matching_input]
            has_output = [...services, matching_output]
          }
        } else {
          has_output = recipe.has_recipe_output.map(output => ({
            ...output,
            resource_quantity: {
              ...output.resource_quantity,
              has_numerical_value: new Decimal(
                output.resource_quantity.has_numerical_value
              )
                .mul(multiplier)
                .toDecimalPlaces(0, Decimal.ROUND_UP)
                .toString()
            }
          }))
          has_input = recipe.has_recipe_input.map(input => ({
            ...input,
            resource_quantity: {
              ...input.resource_quantity,
              has_numerical_value: new Decimal(
                input.resource_quantity.has_numerical_value
              )
                .mul(multiplier)
                .toDecimalPlaces(0, Decimal.ROUND_UP)
                .toString()
            }
          }))
        }
        return [
          ...acc,
          {
            id: recipe.id,
            name: recipe.name,
            process_conforms_to: recipe.process_conforms_to,
            has_output,
            has_input
          }
        ]
      }
    }, [])
  }

  type Commitment = {
    resource_conforms_to: { name: string }
    resource_quantity: { has_numerical_value: string; has_unit: { label: string } }
    receiver: { name: string }
    id: string
  }
  let commitments: Commitment[] = []
  $: aggregatedCommitments = aggregateCommitments(commitments)
  $: allColumns = generateColumns(aggregatedCommitments)
  function createCommitments(requests: { proposed_intents: { intent: any }[] }[]): any[] {
    return requests.flatMap(request =>
      request.proposed_intents.map(proposed_intent => ({
        ...proposed_intent.intent,
        action: 'transfer',
        id: crypto.randomUUID()
      }))
    )
  }
  type Demand = {
    resource_conforms_to: { name: string }
    resource_quantity: { has_numerical_value: string; has_unit: { label: string } }
  }
  function aggregateCommitments(commitments: Commitment[]): Demand[] {
    return Object.values(
      commitments.reduce((acc, commitment) => {
        if (acc[commitment.resource_conforms_to.name]) {
          let existing = acc[commitment.resource_conforms_to.name]
          acc[commitment.resource_conforms_to.name] = {
            ...existing,
            resource_quantity: {
              ...existing.resource_quantity,
              has_numerical_value:
                existing.resource_quantity.has_numerical_value +
                commitment.resource_quantity.has_numerical_value
            }
          }
        } else {
          acc[commitment.resource_conforms_to.name] = {
            resource_quantity: commitment.resource_quantity,
            resource_conforms_to: commitment.resource_conforms_to,
            stage: { name: 'Ship' }
          }
        }
        return acc
      }, {})
    )
  }
  function generateColumns(aggregatedCommitments: any[]): any[] {
    let previousProcesses = previousColumn(aggregatedCommitments)
    let allColumns: any[] = []
    while (previousProcesses.length != 0) {
      allColumns = [previousProcesses, ...allColumns]
      previousProcesses = previousColumn(
        previousProcesses
          .flatMap((it: any) => it.has_input)
          .reduce((acc: any[], process: any) => {
            return [...acc, process]
          }, [])
      )
    }
    return allColumns
  }

  let planModalOpen = false
  let commitmentModalOpen = false
  let selectedCommitmentId: string | undefined = undefined
</script>

<PlanModal bind:open={planModalOpen} />
<CommitmentModal
  bind:open={commitmentModalOpen}
  {selectedCommitmentId}
  bind:commitments
/>

<!-- custom header introduced to enable planning to be more inline with the beginning of the page -->
<div class="custom-background" style="height: 8vh">
  <div class="mx-auto px-2 sm:px-6 lg:px-8">
    <h2 class="pt-1 text-white text-2xl">Planning</h2>
    <p class="text-white text-xs">This page is for demonstration purposes only</p>
  </div>
</div>

<div class="pt-4 flex justify-center items-center">
  <div class="flex space-x-8 mx-4 overflow-x-scroll">
    <div class="min-w-[200px]">
      <div class="flex justify-center" style="margin-top: 22px; margin-bottom: 22px">
        <button
          type="button"
          on:click={() => (planModalOpen = true)}
          class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >Save plan</button
        >
      </div>
      <h2 class="text-center text-xl font-semibold">Offers</h2>
      <div class="bg-blue-300 border border-gray-400 p-2">
        <!-- Sub-columns -->
        <div class="">
          <div>
            {#each [] as { proposed_intents }}
              {@const reciprocal = proposed_intents.find(it => it.reciprocal)}
              {@const primary = proposed_intents.find(it => !it.reciprocal)}
              <div
                class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
              >
                <p>{primary?.intent?.resource_conforms_to?.name}</p>
                {#if primary?.intent?.available_quantity}
                  <p>
                    {primary?.intent?.available_quantity?.has_numerical_value}
                    {primary?.intent?.available_quantity?.has_unit?.label},
                    {reciprocal?.intent?.resource_quantity?.has_numerical_value}
                    USD per lb
                  </p>
                {:else}
                  <p>
                    {reciprocal?.intent?.resource_quantity?.has_numerical_value}
                    USD per lb
                  </p>
                {/if}
                <p>{primary?.intent?.provider?.name}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!--
    <div>
      <h2 class="text-center">Offers</h2>
      <div class="bg-blue-300 border border-gray-400 p-2">
        <div
          class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
        >
          <p>Brown Alpaca Dirty</p>
          <div class="flex justify-between">
            <p>20 lbs</p>
            <p>20 lbs</p>
          </div>
          <p>WoodLand Meadow</p>
        </div>
      </div>
    </div>
    -->
    <!-- Main Columns -->
    {#each allColumns as processes}
      {@const { image, name } = processes[0].process_conforms_to}
      <div class="min-w-[400px]">
        <img class="mx-auto" height="80px" width="80px" src={image} alt="" />
        <h2 class="text-center text-xl font-semibold">{name}</h2>
        {#each processes as { has_input, has_output }}
          <div class="bg-gray-400 border border-gray-400 p-2">
            <!-- Sub-columns -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                {#each has_input as { resource_conforms_to, provider, resource_quantity, action }}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                  >
                    <p>{resource_conforms_to?.name}</p>
                    <div class="flex justify-between">
                      <!--
                      <p>
                        {supply_driven_quantity?.has_numerical_value}
                        {supply_driven_quantity?.has_unit?.label}
                      </p>
                      -->
                      <p>
                        {action}
                        {new Decimal(resource_quantity?.has_numerical_value).toString()}
                        {resource_quantity?.has_unit?.label}
                      </p>
                      <!--
                      <p>
                        {demand_driven_quantity?.has_numerical_value}
                        {demand_driven_quantity?.has_unit?.label}
                      </p>
                      -->
                    </div>
                    <p>{provider?.name || ''}</p>
                  </div>
                {/each}
              </div>
              <div>
                {#each has_output as { resource_conforms_to, receiver, provider, resource_quantity, action }}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                  >
                    <p>{resource_conforms_to?.name}</p>
                    <div class="flex justify-between">
                      <!--
                      <p>
                        {supply_driven_quantity?.has_numerical_value}
                        {supply_driven_quantity?.has_unit?.label}
                      </p>
                      -->
                      <p>
                        {action}
                        {resource_quantity?.has_numerical_value}
                        {resource_quantity?.has_unit?.label}
                      </p>
                      <!--
                      <p>
                        {demand_driven_quantity?.has_numerical_value}
                        {demand_driven_quantity?.has_unit?.label}
                      </p>
                      -->
                    </div>
                    <p>{(receiver || provider)?.name || ''}</p>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/each}

    <div class="min-w-[250px]">
      <div class="flex justify-center" style="margin-top: 22px; margin-bottom: 22px">
        <button
          type="button"
          on:click={() => {
            commitmentModalOpen = true
          }}
          class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >Add a commitment</button
        >
      </div>
      <h2 class="text-center text-xl font-semibold">Commitments</h2>
      <div class="bg-blue-300 border border-gray-400 p-2">
        <!-- Sub-columns -->
        <div class="">
          <div>
            {#if commitments.length == 0}
              <div class="flex justify-center my-4">
                <button
                  type="button"
                  on:click={() => (commitments = createCommitments(requests))}
                  class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >Create from requests</button
                >
              </div>
            {/if}
            {#each commitments as { resource_conforms_to, resource_quantity, receiver, id }}
              <div
                class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs flex"
              >
                <div>
                  <p>{resource_conforms_to?.name}</p>
                  <p>
                    {resource_quantity?.has_numerical_value}
                    {resource_quantity?.has_unit?.label}
                  </p>
                  <p>{receiver?.name}</p>
                </div>
                <button
                  class="ml-6"
                  on:click={() => (commitments = commitments.filter(it => it.id != id))}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-8 h-8"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <button
                  class="ml-2"
                  on:click={() => {
                    selectedCommitmentId = id
                    commitmentModalOpen = true
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                    />
                  </svg>
                </button>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <div class="min-w-[200px] mt-20">
      <h2 class="text-center text-xl font-semibold">Requests</h2>
      <div class="bg-blue-300 border border-gray-400 p-2">
        <!-- Sub-columns -->
        <div class="">
          <div>
            {#each requests as { proposed_intents }}
              {@const reciprocal = proposed_intents.find(it => it.reciprocal)}
              {@const primary = proposed_intents.find(it => !it.reciprocal)}
              <div
                class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
              >
                <p>{primary?.intent?.resource_conforms_to?.name}</p>
                <p>
                  {primary?.intent?.resource_quantity?.has_numerical_value}
                  {primary?.intent?.resource_quantity?.has_unit?.label}
                </p>
                <p>{primary?.intent?.receiver?.name}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom CSS */
  .custom-background {
    background-image: url('/heading3.png');
    background-size: cover;
    background-position: center;
  }
</style>
