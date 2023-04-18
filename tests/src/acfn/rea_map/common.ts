import { CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeActionHash, fakeAgentPubKey, fakeEntryHash, fakeDnaHash } from '@holochain/client';



export async function sampleReaAgent(cell: CallableCell, partialReaAgent = {}) {
    return {
        ...{
	  name: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	  latitude: -10,
	  longitude: -10,
	  image_url: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	  address: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	  icon_url: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
        ...partialReaAgent
    };
}

export async function createReaAgent(cell: CallableCell, reaAgent = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "rea_map",
      fn_name: "create_rea_agent",
      payload: reaAgent || await sampleReaAgent(cell),
    });
}

