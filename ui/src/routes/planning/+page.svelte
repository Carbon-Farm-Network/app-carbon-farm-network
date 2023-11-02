<script lang="ts">
  import recipes from '$lib/data/recipes.json'
  import demands from '$lib/data/demands.json'
  import { onMount } from 'svelte'
  import { Decimal } from 'decimal.js'

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

  let previousProcesses = previousColumn(demands)
  let allColumns: any[] = []
  onMount(() => {
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
  })
</script>

<!-- custom header introduced to enable planning to be more inline with the beginning of the page -->
<div class="custom-background" style="height: 8vh">
  <div class="mx-auto px-2 sm:px-6 lg:px-8">
    <h2 class="pt-1 text-white text-2xl">Planning</h2>
    <p class="text-white text-xs">This page is for demonstration purposes only</p>
  </div>
</div>

<div class="pt-4 flex justify-center items-center">
  <div class="flex space-x-8 mx-4 overflow-x-scroll">
    <div class="min-w-[200px] mt-20">
      <h2 class="text-center">Offers</h2>
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
    {#each allColumns as processes, index}
      <div class="min-w-[400px]">
        <!-- <img class="mx-auto" height="80px" width="80px" src={image} alt="" /> -->
        <h2 class="text-center">Column {index}</h2>
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

    <div class="min-w-[200px] mt-20">
      <h2 class="text-center">Requests</h2>
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
