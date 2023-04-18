<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, DnaHash, ActionHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';
import { clientContext } from '../../contexts';
import type { ReaAgent } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

import '@material/mwc-textarea';
import '@material/mwc-slider';
let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

export let originalReaAgentHash!: ActionHash;

export let currentRecord!: Record;
let currentReaAgent: ReaAgent = decode((currentRecord.entry as any).Present.entry) as ReaAgent;

let name: string | undefined = currentReaAgent.name;
let latitude: number | undefined = currentReaAgent.latitude;
let longitude: number | undefined = currentReaAgent.longitude;
let imageUrl: string | undefined = currentReaAgent.image_url;
let address: string | undefined = currentReaAgent.address;
let iconUrl: string | undefined = currentReaAgent.icon_url;

let errorSnackbar: Snackbar;

$: name, latitude, longitude, imageUrl, address, iconUrl;
$: isReaAgentValid = true && name !== '' && true && true && imageUrl !== '' && address !== '' && iconUrl !== '';

onMount(() => {
  if (currentRecord === undefined) {
    throw new Error(`The currentRecord input is required for the EditReaAgent element`);
  }
  if (originalReaAgentHash === undefined) {
    throw new Error(`The originalReaAgentHash input is required for the EditReaAgent element`);
  }
});

async function updateReaAgent() {

  const reaAgent: ReaAgent = { 
    name: name!,
    latitude: latitude!,
    longitude: longitude!,
    image_url: imageUrl!,
    address: address!,
    icon_url: iconUrl!,
  };

  try {
    const updateRecord: Record = await client.callZome({
      cap_secret: null,
      role_name: 'acfn',
      zome_name: 'rea_map',
      fn_name: 'update_rea_agent',
      payload: {
        original_rea_agent_hash: originalReaAgentHash,
        previous_rea_agent_hash: currentRecord.signed_action.hashed.hash,
        updated_rea_agent: reaAgent
      }
    });
  
    dispatch('rea-agent-updated', { actionHash: updateRecord.signed_action.hashed.hash });
  } catch (e) {
    errorSnackbar.labelText = `Error updating the rea agent: ${e.data.data}`;
    errorSnackbar.show();
  }
}

</script>
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Edit ReaAgent</span>
  
  <div style="margin-bottom: 16px">
    <mwc-textarea outlined label="Name" value={ name } on:input={e => { name = e.target.value;} } required></mwc-textarea>    
  </div>

  <div style="margin-bottom: 16px">
    <div style="display: flex; flex-direction: row">
      <span style="margin-right: 4px">Latitude</span>
    
      <mwc-slider value={ latitude } on:input={e => { latitude = e.detail.value; } } discrete></mwc-slider>
    </div>    
  </div>

  <div style="margin-bottom: 16px">
    <div style="display: flex; flex-direction: row">
      <span style="margin-right: 4px">Longitude</span>
    
      <mwc-slider value={ longitude } on:input={e => { longitude = e.detail.value; } } discrete></mwc-slider>
    </div>    
  </div>

  <div style="margin-bottom: 16px">
    <mwc-textarea outlined label="Image Url" value={ imageUrl } on:input={e => { imageUrl = e.target.value;} } required></mwc-textarea>    
  </div>

  <div style="margin-bottom: 16px">
    <mwc-textarea outlined label="Address" value={ address } on:input={e => { address = e.target.value;} } required></mwc-textarea>    
  </div>

  <div style="margin-bottom: 16px">
    <mwc-textarea outlined label="Icon Url" value={ iconUrl } on:input={e => { iconUrl = e.target.value;} } required></mwc-textarea>    
  </div>


  <div style="display: flex; flex-direction: row">
    <mwc-button
      outlined
      label="Cancel"
      on:click={() => dispatch('edit-canceled')}
      style="flex: 1; margin-right: 16px"
    ></mwc-button>
    <mwc-button 
      raised
      label="Save"
      disabled={!isReaAgentValid}
      on:click={() => updateReaAgent()}
      style="flex: 1;"
    ></mwc-button>
  </div>
</div>
