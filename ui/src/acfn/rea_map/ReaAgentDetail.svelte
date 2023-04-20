<script lang="ts">
import { createEventDispatcher, onMount } from 'svelte';
import { query } from "svelte-apollo"
import gql from 'gql-tag'
import { ID } from '@valueflows/vf-graphql'

import '@material/mwc-circular-progress';
import type { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-snackbar';
import '@material/mwc-icon-button';
import EditReaAgent from './EditReaAgent.svelte';

const dispatch = createEventDispatcher();

export let reaAgentHash: ID;

let editing = false;

let errorSnackbar: Snackbar;

$: editing;

const READ_AGENT = gql`
	query GetMyAgent($id: ID!) {
		agent(id: $id) {
			id
			name
		}
	}
`

const record = query(READ_AGENT, {
	variables: { id: reaAgentHash },
});
$: record.refetch({ reaAgentHash });

onMount(async () => {
  if (reaAgentHash === undefined) {
    throw new Error(`The reaAgentHash input is required for the ReaAgentDetail element`);
  }
});

async function deleteReaAgent() {
  try {
    // :TODO:
  } catch (e: any) {
    errorSnackbar.labelText = `Error deleting the rea agent: ${e.data.data}`;
    errorSnackbar.show();
  }
}
</script>

<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>

{#if record.loading}
<div style="display: flex; flex: 1; align-items: center; justify-content: center">
  <mwc-circular-progress indeterminate></mwc-circular-progress>
</div>
{:else if record.error}
<span>Error fetching the rea agent: {record.error}</span>
{:else if editing}
<!-- :TODO: there is work to do here RE rewiring update logics -->
<EditReaAgent
  originalReaAgentHash={reaAgentHash}
  currentRecord={record.data.agent}
  on:rea-agent-updated={async () => {
    editing = false;
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
    <span style="white-space: pre-line">{ record.data.agent.name }</span>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Latitude:</strong></span>
    <span style="white-space: pre-line">{ record.data.agent.latitude }</span>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Longitude:</strong></span>
    <span style="white-space: pre-line">{ record.data.agent.longitude }</span>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Image Url:</strong></span>
    <span style="white-space: pre-line">{ record.data.agent.image_url }</span>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Address:</strong></span>
    <span style="white-space: pre-line">{ record.data.agent.address }</span>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Icon Url:</strong></span>
    <span style="white-space: pre-line">{ record.data.agent.icon_url }</span>
  </div>

</div>
{/if}
