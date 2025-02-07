import { get } from 'svelte/store';
import { encodeHashToBase64, AppClient } from '@holochain/client';
import { writable } from 'svelte/store';
import { effect } from './effect';

export const clientHC = writable(null);
let client: AppClient | null = null;
clientHC.subscribe(value => {
  client = value;
});

type SignalListener = {
    listening: boolean;
    updates: boolean;
    new: boolean;
};
export const listening = writable<{ [entryType: string] : SignalListener }>

// store of hash lookups for each item
// store of "all" items as list of hashes
export const units = writable<{ [key: string]: any }>({});
export const allUnits = writable<string[]>([]);
export const resourceSpecifications = writable<{ [key: string]: any }>({});
export const allResourceSpecifications = writable<string[]>([]);

async function callZome(fn_name: string, payload: any) {
    if (client) {
        return await client.callZome({
            cap_secret: null,
            role_name: 'hrea',
            zome_name: 'hrea',
            fn_name: fn_name,
            payload: payload,
        });
    } else {
        console.error('No client found');
    }
}

type EntryCalls = {
    [key: string]: {
        create: string;
        get: string;
        update: string;
        delete: string;
        all: string;
        store: any;
        linkedFields: {
            [key: string]: {
                name: string;
                strategy: string;
                entryZomeCall: string;
                linksZomeCall?: string;
            };
        };
    };
};

const entryCalls: EntryCalls = {
    unit: {
        create: 'create_unit',
        get: 'get_unit',
        update: 'update_unit',
        delete: 'delete_unit',
        all: 'get_all_units',
        store: units,
        linkedFields: {}
    },
    resourceSpecification: {
        create: 'create_resource_specification',
        get: 'get_resource_specification',
        update: 'update_resource_specification',
        delete: 'delete_resource_specification',
        all: 'get_all_resource_specifications',
        store: resourceSpecifications,
        linkedFields: {
            defaultUnitOfResource: {
                name: 'unit',
                strategy: 'direct',
                entryZomeCall: 'get_unit'
            }
        }
    },
    // Add other entries here as needed
};

class EntryData {
    constructor(entryType: string, hash: string) {
        this.entryType = entryType;
        this.hash = hash;
    }
    entryType: string;
    hash: string;
}

const fetchEntry = async (entryType: string, hash: string, query: any = {}) => {
    const entry = await callZome(entryCalls[entryType].get, hash);

    const topFields = Object.keys(query).filter(field => field in entryCalls[entryType].linkedFields);
    for (const field of topFields) {
        const fieldInfo = entryCalls[entryType].linkedFields[field];
        if (fieldInfo.strategy === 'direct') {
            await ensureEntry(fieldInfo.name, entry[field]);
            entry[field] = (entryCalls[fieldInfo.name].store)[entry[field]];
        } else if (fieldInfo.strategy === 'linked') {
            // @ts-ignore
            const links = await callZome(fieldInfo.linksZomeCall, hash);
            for (const link of links) {
                await ensureEntry(fieldInfo.name, link.target);
            }
        }
    }

    units.update(v => {
        return { ...v, [hash]: entry };
    });
    if (!get(allUnits).includes(hash)) {
        allUnits.update(v => {
            return [...v, hash];
        });
    }
};

const ensureEntry = async (entryType: string, hash: string, linkedFields?: string[] | 'all') => {
    if (!get(units)[hash]) {
        await fetchEntry(entryType, hash, linkedFields);
    }
};

const fetchAllEntries = async (entryType: string) => {
    const links = await callZome(entryCalls[entryType].all, null);
    for (const link of links) {
        await ensureEntry(entryType, link.target);
    }
};