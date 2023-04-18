<script lang="ts">
import { createEventDispatcher, onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';
import type { Record, ActionHash, AppAgentClient, EntryHash, AgentPubKey, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { ReaAgent } from './types';
import '@material/mwc-circular-progress';
import type { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-snackbar';
import '@material/mwc-icon-button';
import EditReaAgent from './EditReaAgent.svelte'; 

const dispatch = createEventDispatcher();

export let reaAgentHash: ActionHash;

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let loading = true;
let error: any = undefined;

let record: Record | undefined;
let reaAgent: ReaAgent | undefined;

let editing = false;

let errorSnackbar: Snackbar;
  
$: editing,  error, loading, record, reaAgent;

onMount(async () => {
  if (reaAgentHash === undefined) {
    throw new Error(`The reaAgentHash input is required for the ReaAgentDetail element`);
  }
  await fetchReaAgent();
});

async function fetchReaAgent() {
  loading = true;
  error = undefined;
  record = undefined;
  reaAgent = undefined;
  
  try {
    record = await client.callZome({
      cap_secret: null,
      role_name: 'acfn',
      zome_name: 'rea_map',
      fn_name: 'get_rea_agent',
      payload: reaAgentHash,
    });
    if (record) {
      reaAgent = decode((record.entry as any).Present.entry) as ReaAgent;
    }
  } catch (e) {
    error = e;
  }

  loading = false;
}

async function deleteReaAgent() {
  try {
    await client.callZome({
      cap_secret: null,
      role_name: 'acfn',
      zome_name: 'rea_map',
      fn_name: 'delete_rea_agent',
      payload: reaAgentHash,
    });
    dispatch('rea-agent-deleted', { reaAgentHash: reaAgentHash });
  } catch (e: any) {
    errorSnackbar.labelText = `Error deleting the rea agent: ${e.data.data}`;
    errorSnackbar.show();
  }
}
</script>

<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>

{#if loading}
<div style="display: flex; flex: 1; align-items: center; justify-content: center">
  <mwc-circular-progress indeterminate></mwc-circular-progress>
</div>
{:else if error}
<span>Error fetching the rea agent: {error.data.data}</span>
{:else if editing}
<EditReaAgent
  originalReaAgentHash={ reaAgentHash}
  currentRecord={record}
  on:rea-agent-updated={async () => {
    editing = false;
    await fetchReaAgent()
  } }
  on:edit-canceled={() => { editing = false; } }
></EditReaAgent>
{:else}

<div style="display: flex; flex-direction: column">
  <div style="display: flex; flex-direction: row">
    <span style="flex: 1"></span>
    <mwc-icon-button style="margin-left: 8px" icon="edit" on:click={() => { editing = true; } }></mwc-icon-button>
    <mwc-icon-button style="margin-left: 8px" icon="delete" on:click={() => deleteReaAgent()}></mwc-icon-button>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Name:</strong></span>
    <span style="white-space: pre-line">{ reaAgent.name }</span>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Latitude:</strong></span>
    <span style="white-space: pre-line">{ reaAgent.latitude }</span>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Longitude:</strong></span>
    <span style="white-space: pre-line">{ reaAgent.longitude }</span>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Image Url:</strong></span>
    <span style="white-space: pre-line">{ reaAgent.image_url }</span>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Address:</strong></span>
    <span style="white-space: pre-line">{ reaAgent.address }</span>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Icon Url:</strong></span>
    <span style="white-space: pre-line">{ reaAgent.icon_url }</span>
  </div>

</div>
{/if}

