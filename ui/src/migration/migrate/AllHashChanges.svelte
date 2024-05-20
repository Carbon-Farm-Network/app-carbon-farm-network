<script lang="ts">
import { onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import type { EntryHash, Record, AgentPubKey, ActionHash, AppAgentClient, NewEntryAction } from '@holochain/client';
import { clientContext } from '../../contexts';
import HashChangeDetail from './HashChangeDetail.svelte';
import type { MigrateSignal } from './types';


let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let hashes: Array<ActionHash> | undefined;
let loading = true;
let error: any = undefined;

$: hashes, loading, error;

onMount(async () => {

  await fetchHashChanges();
  client.on('signal', signal => {
    if (signal.zome_name !== 'migrate') return;
    const payload = signal.payload as MigrateSignal;
    if (payload.type !== 'EntryCreated') return;
    if (payload.app_entry.type !== 'HashChange') return;
    hashes = [...hashes, payload.action.hashed.hash];
  });
});

async function fetchHashChanges() {
  try {
    const links = await client.callZome({
      cap_secret: null,
      role_name: 'migration',
      zome_name: 'migrate',
      fn_name: 'get_all_hash_changes',
      payload: null,
    });
    hashes = links.map(l => l.target);
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
<span>Error fetching the hash changes: {error.data.data}.</span>
{:else if hashes.length === 0}
<span>No hash changes found.</span>
{:else}
<div style="display: flex; flex-direction: column">
  {#each hashes as hash}
    <div style="margin-bottom: 8px;">
      <HashChangeDetail hashChangeHash={hash}  on:hash-change-deleted={() => fetchHashChanges()}></HashChangeDetail>
    </div>
  {/each}
</div>
{/if}

