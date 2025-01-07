import { setActions, clientStored, setAgents, updateAnAgent, setUnits, setResourceSpecifications, setProcessSpecifications, setProposals, setHashChanges, setEconomicEvents, setEconomicResources } from './crud/store'
// import { mutation, query } from 'svelte-apollo'
import { WeaveClient, isWeContext, initializeHotReload, type WAL} from '@lightningrodlabs/we-applet';
import { appletServices } from '../we';
import { decode } from '@msgpack/msgpack';

// define type
// type HashChange = {
//   original: string,
//   current: string
// }

// export async function getAllHashChanges() {
//   if (isWeContext()) {
//       let weClient = await WeaveClient.connect(appletServices);
//       let res = await weClient.renderInfo.appletClient.callZome({
//           cap_secret: null,
//           role_name: 'migration',
//           zome_name: 'migrate',
//           fn_name: 'get_all_hash_changes',
//           payload: null,
//       })
//       let hashMap = {}
//       for (let i = 0; i < res.length; i++) {
//       // criterion = decode((record.entry as any).Present.entry) as Criterion;
//         let decoded = decode((res[i].entry as any).Present.entry) as HashChange
//         hashMap[decoded.original] = decoded.current
//       }
//       setHashChanges(hashMap)
//   }
// }

// export async function addHashChange(original: string, newHash: string) {
//   if (isWeContext()) {
//       let weClient = await WeClient.connect(appletServices);
//       await weClient.renderInfo.appletClient.callZome({
//           cap_secret: null,
//           role_name: 'migration',
//           zome_name: 'migrate',
//           fn_name: 'create_hash_change',
//           payload: {
//               original: String(original),
//               current: String(newHash),
//           },
//       })
//       getAllHashChanges()
//   }
// }

let client: any;
clientStored.subscribe(value => {
  client = value;
});

export function clickOutside(node: HTMLElement): { destroy: () => void } {
  const handleClick = (event: MouseEvent): void => {
    if (!node.contains(event.target as Node)) {
      node.dispatchEvent(new CustomEvent('outclick'));
    }
  };

  document.addEventListener('click', handleClick, true);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    }
  };
}