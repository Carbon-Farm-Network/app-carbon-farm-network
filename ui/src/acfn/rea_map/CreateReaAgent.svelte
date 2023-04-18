<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { ReaAgent } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

import '@material/mwc-slider';
import '@material/mwc-textarea';
let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();


let name: string = '';
let latitude: number = 0;
let longitude: number = 0;
let imageUrl: string = '';
let address: string = '';
let iconUrl: string = '';

let errorSnackbar: Snackbar;

$: name, latitude, longitude, imageUrl, address, iconUrl;
$: isReaAgentValid = true && name !== '' && true && true && imageUrl !== '' && address !== '' && iconUrl !== '';

onMount(() => {
});

async function createReaAgent() {  
  const reaAgentEntry: ReaAgent = { 
    name: name!,
    latitude: latitude!,
    longitude: longitude!,
    image_url: imageUrl!,
    address: address!,
    icon_url: iconUrl!,
  };
  
  try {
    const record: Record = await client.callZome({
      cap_secret: null,
      role_name: 'acfn',
      zome_name: 'rea_map',
      fn_name: 'create_rea_agent',
      payload: reaAgentEntry,
    });
    dispatch('rea-agent-created', { reaAgentHash: record.signed_action.hashed.hash });
  } catch (e) {
    errorSnackbar.labelText = `Error creating the rea agent: ${e.data.data}`;
    errorSnackbar.show();
  }
}

</script>
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Create ReaAgent</span>
  

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
            

  <mwc-button 
    raised
    label="Create ReaAgent"
    disabled={!isReaAgentValid}
    on:click={() => createReaAgent()}
  ></mwc-button>
</div>
