import { writable } from 'svelte/store';

export const allHashChanges = writable([]);
export const clientStored = writable(null);
export const allAgents = writable([]);
export const allFacets = writable([]);
export const allFacetValues = writable([]);
export const allUnits = writable([]);
export const allResourceSpecifications = writable([]);
export const allProcessSpecifications = writable([]);
export const allProposals = writable([]);

export function setHashChanges(newHashChanges: any) {
    allHashChanges.update(v => newHashChanges);
}

export function setClient(client: any) {
    clientStored.update(v => client);
    console.log("set client", clientStored)
}

export function setAgents(newAgents: any) {
    allAgents.update(v => newAgents);
}

export function updateAnAgent(agent: any) {
    allAgents.update(v => {
        let newAgents = v.map((a: any) => {
            if (a.id == agent.id) {
                // combine all fields
                return { ...agent, ...a };
            }
            return a;
        });
        return newAgents;
    });
    console.log("updated agent", agent)
}

export function setFacets(newFacets: any) {
    allFacets.update(v => newFacets);
}

export function setFacetValues(newFacetValues: any) {
    allFacetValues.update(v => newFacetValues);
}

export function setUnits(newUnits: any) {
    allUnits.update(v => newUnits);
}

export function setResourceSpecifications(newResourceSpecifications: any) {
    allResourceSpecifications.update(v => newResourceSpecifications);
}

export function setProcessSpecifications(newProcessSpecifications: any) {
    allProcessSpecifications.update(v => newProcessSpecifications);
}

export function setProposals(newProposals: any) {
    allProposals.update(v => newProposals);
}