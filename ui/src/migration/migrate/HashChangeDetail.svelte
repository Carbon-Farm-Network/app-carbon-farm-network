<script lang="ts">
import { createEventDispatcher, onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';
import type { Record, ActionHash, AppAgentClient, EntryHash, AgentPubKey, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { HashChange } from './types';
import '@material/mwc-circular-progress';
import type { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-snackbar';
import '@material/mwc-icon-button';

const dispatch = createEventDispatcher();

export let hashChangeHash: ActionHash;

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let loading: boolean;
let error: any = undefined;

let record: Record | undefined;
let hashChange: HashChange | undefined;


  
$:  error, loading, record, hashChange;

onMount(async () => {
  if (hashChangeHash === undefined) {
    throw new Error(`The hashChangeHash input is required for the HashChangeDetail element`);
  }
  await fetchHashChange();
});

async function fetchHashChange() {
  loading = true;
  
  try {
    record = await client.callZome({
      cap_secret: null,
      role_name: 'migration',
      zome_name: 'migrate',
      fn_name: 'get_hash_change',
      payload: hashChangeHash,
    });
    if (record) {
      hashChange = decode((record.entry as any).Present.entry) as HashChange;
    }
  } catch (e) {
    error = e;
  }

  loading = false;
}

</script>


{#if loading}
<div style="display: flex; flex: 1; align-items: center; justify-content: center">
  <mwc-circular-progress indeterminate></mwc-circular-progress>
</div>
{:else if error}
<span>Error fetching the hash change: {error.data.data}</span>
{:else}

<div style="display: flex; flex-direction: column">
  <div style="display: flex; flex-direction: row">
    <span style="flex: 1"></span>
  </div>

</div>
{/if}

