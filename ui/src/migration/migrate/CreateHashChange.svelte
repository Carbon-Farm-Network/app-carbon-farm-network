<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { HashChange } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

export let original!: string;

export let current!: string;



let errorSnackbar: Snackbar;

$: original, current;
$: isHashChangeValid = true;

onMount(() => {
  if (original === undefined) {
    throw new Error(`The original input is required for the CreateHashChange element`);
  }
  if (current === undefined) {
    throw new Error(`The current input is required for the CreateHashChange element`);
  }
});

async function createHashChange() {  
  const hashChangeEntry: HashChange = { 
    original: original!,
    current: current!,
  };
  
  try {
    const record: Record = await client.callZome({
      cap_secret: null,
      role_name: 'migration',
      zome_name: 'migrate',
      fn_name: 'create_hash_change',
      payload: hashChangeEntry,
    });
    dispatch('hash-change-created', { hashChangeHash: record.signed_action.hashed.hash });
  } catch (e) {
    errorSnackbar.labelText = `Error creating the hash change: ${e.data.data}`;
    errorSnackbar.show();
  }
}

</script>
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Create HashChange</span>
  


  <mwc-button 
    raised
    label="Create HashChange"
    disabled={!isHashChangeValid}
    on:click={() => createHashChange()}
  ></mwc-button>
</div>
