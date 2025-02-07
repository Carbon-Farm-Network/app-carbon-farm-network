<script lang="ts">
  import Header from '$lib/Header.svelte'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { deletePlan, deleteProcess, deleteAgreement, deleteCommitment, deleteEconomicEvent } from '../../crud/commit'
  import { getAllPlans, getPlan } from '../../crud/fetch'
  import { plansList, fullPlans } from '../../crud/store';
  import Loading from '$lib/Loading.svelte'
  import SvgIcon from '$lib/SvgIcon.svelte'

  let plans: any[];
  plansList.subscribe(value => {
    plans = value
  })

  let allFullPlans: any = {}
  fullPlans.subscribe(value => {
    allFullPlans = value
  })

  let exportOpen = false
  let importing = false
  let loading = false
  let fetching = false
  let deleting = false

  async function removePlan(id: string, revisionId: string) {
    let areYouSure = await confirm("Are you sure you want to delete this plan?")
    if (areYouSure == true) {
      deleting = true
      let fullPlan = allFullPlans[id]
      if (!fullPlan) {
        await getPlan(id)
        fullPlan = allFullPlans[id]
      }
      if (!fullPlan) {
        console.error('no full plan found')
        return
      }
      console.log('fullPlan', fullPlan)
      for (let process of fullPlan.processes) {
        const processCommitments = [...process.committedInputs, ...process.committedOutputs]
        for (let commitment of processCommitments) {
          const economicEvents = commitment.fulfilleedBy?.economicEvents || []
          for (let economicEvent of economicEvents) {
            try {
              await deleteEconomicEvent(economicEvent.id)
            } catch (error) {
              console.error('error deleting economic event', error)
            }
          }

          const agreementRevisionId = commitment.clauseOf?.revisionId
          try {
            await deleteAgreement(agreementRevisionId)
          } catch (error) {
            console.error('error deleting commitment', error)
          }

          const recipocals = commitment.clauseOf?.commitments || []
          for (let recipocal of recipocals) {
            const recipocalEconomicEvents = recipocal.fulfilleedBy?.economicEvents || []
            for (let recipocalEconomicEvent of recipocalEconomicEvents) {
              try {
                await deleteEconomicEvent(recipocalEconomicEvent.revisionId)
              } catch (error) {
                console.error('error deleting recipocal economic event', error)
              }
            }
            try {
              await deleteCommitment(recipocal.revisionId)
            } catch (error) {
              console.error('error deleting recipocal commitment', error)
            }
          }
          try {
            await deleteCommitment(commitment.revisionId)
          } catch (error) {
            console.error('error deleting commitment', error)
          }
        }

        // try {
        //   console.log('deleting process', process.revisionId)
        //   await deleteProcess(process.revisionId)
        // } catch (error) {
        //   console.error('error deleting process', error)
        // }
      }
      
      const otherCommitments = [...fullPlan.nonProcessCommitments, ...fullPlan.independentDemands]
      for (let commitment of otherCommitments) {
        const economicEvents = commitment.fulfilleedBy?.economicEvents || []
        for (let economicEvent of economicEvents) {
          try {
            await deleteEconomicEvent(economicEvent.id)
          } catch (error) {
            console.error('error deleting economic event', error)
          }
        }
        const recipocals = commitment.clausOf?.committments || []
        for (let recipocal of recipocals) {
          const recipocalEconomicEvents = recipocal.fulfilleedBy?.economicEvents || []
          for (let recipocalEconomicEvent of recipocalEconomicEvents) {
            try {
              await deleteEconomicEvent(recipocalEconomicEvent.revisionId)
            } catch (error) {
              console.error('error deleting recipocal economic event', error)
            }
          }
          try {
            await deleteCommitment(recipocal.revisionId)
          } catch (error) {
            console.error('error deleting recipocal commitment', error)
          }
        }
        try {
          await deleteCommitment(commitment.revisionId)
        } catch (error) {
          console.error('error deleting commitment', error)
        }
      }

      try {
        await deletePlan(fullPlan.revisionId)
      } catch (error) {
        console.error('error deleting plan', error)
      }
      await getAllPlans()
      deleting = false
    }
  }

  async function refresh() {
    fetching = true
    await getAllPlans()
    fetching = false
  }

  onMount(async () => {
    loading = plans.length == 0
    if (loading) {
      await getAllPlans()
      loading = false
      console.log('plans', plans)
    }
  })


</script>

<!-- <div style="height: 8vh"> -->
  <Header title="Plans" description="Current operational planning" />
<!-- </div> -->

{#if loading || deleting}
<Loading />
{/if}

<div class="p-12">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <!-- <h1 class="text-base font-semibold leading-6 text-gray-900">Offers</h1>
      <p class="mt-2 text-sm text-gray-700">
        The goods or services you are offering within the network, now or generally.
      </p> -->
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

    <div class="mt-4 sm:ml-3 sm:mt-0 sm:flex-none">
      <button
        type="button"
        on:click={() => goto('/plans/new')}
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a plan</button
      >
    </div>
    <!-- <Export bind:importing bind:open={exportOpen} dataName="list of plans" fileName="cfn-plans"
    data={plans}
      on:import={async (event) => {
        console.log('importing', event.detail)
      }}
    /> -->
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
                >Name</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Description</th
              >
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white">
            <!-- {#each offers as { proposed_intents }, index} -->
            {#if plans && plans.length > 0}
            
            {#each plans as plan, index}
              <tr class={index % 2 == 0 ? 'bg-gray-100' : ''}>
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-3"
                  >{plan.name}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{plan.note}</td>
                <td
                  class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
                >
                  <button type="button" class="text-indigo-600 hover:text-indigo-900"
                  on:click={() => {
                    goto(`/plans/update/${encodeURIComponent(plan.id)}`)
                  }}
                  >Open<span class="sr-only">, {name}</span></button
                  >
                  &nbsp;
                  <button type="button" class="text-indigo-600 hover:text-indigo-900"
                  on:click={() => {
                    console.log('delete', plan.id)
                    removePlan(plan.id, plan.revisionId)
                  }}
                  >
                    Delete</button
                  >
                </td>
              </tr>
            {/each}
            {/if}

          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
