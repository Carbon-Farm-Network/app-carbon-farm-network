<script lang="ts">
    import { clickOutside } from '../../utils'
    import { onMount } from 'svelte'
    import { createEventDispatcher } from 'svelte';
    import type { AgentConnection, Agent, UnitConnection, Action } from '@leosprograms/vf-graphql'
    import { cloneDeep } from "lodash"
    export let open = false
    export let agreement: any = {}
    export let commitment: any = {}
    export let reciprocalCommitment: any = {}

    function checkKey(e: any) {
        if (e.key === 'Escape' && !e.shiftKey) {
            e.preventDefault()
            open = false
        }
    }

    onMount(() => {
        window.addEventListener('keydown', checkKey)
        return () => {
            window.removeEventListener('keydown', checkKey)
        }
    })

</script>

<div class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true" >
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
      class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ease-out duration-300 ease-in duration-200"
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
                use:clickOutside
                >
                <div>
                    <div class="mt-3 text-center sm:mt-5">
                        <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                            Exchange
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
