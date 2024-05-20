import { CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeActionHash, fakeAgentPubKey, fakeEntryHash, fakeDnaHash } from '@holochain/client';



export async function sampleHashChange(cell: CallableCell, partialHashChange = {}) {
    return {
        ...{
	  original: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	  current: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
        ...partialHashChange
    };
}

export async function createHashChange(cell: CallableCell, hashChange = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "migrate",
      fn_name: "create_hash_change",
      payload: hashChange || await sampleHashChange(cell),
    });
}

