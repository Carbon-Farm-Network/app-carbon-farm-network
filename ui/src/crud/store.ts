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
export const allEconomicEvents = writable([]);
export const allEconomicResources = writable([]);
export const allActions = writable([]);
export const fullPlans = writable({});
export const allFulfillments = writable([]);

export function setHashChanges(newHashChanges: any) {
    allHashChanges.update(v => newHashChanges);
}

export function setClient(client: any) {
    clientStored.update(v => client);
}

export function setActions(newActions: any) {
    allActions.update(v => newActions);
}

export function setAgents(newAgents: any) {
    allAgents.update(v => newAgents);
}

export function setEconomicEvents(newEconomicEvents: any) {
    allEconomicEvents.update(v => newEconomicEvents);
}

export function setEconomicResources(newEconomicResources: any) {
    allEconomicResources.update(v => newEconomicResources);
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

export function setFulfillments(newFulfillments: any) {
    allFulfillments.update(v => newFulfillments);
}

export function addToFullPlans(newPlan: any) {
    fullPlans.update(v => {
        return { ...v, [newPlan.id]: newPlan };
    });
}

export function updateProcessInPlan(process: any) {
    console.log('updateProcessInPlan', process);
    const planId = process.plannedWithin.id;
    fullPlans.update(v => {
        // find the plan with the correct id
        // then replace the relevant process with the new one
        let newPlan = v[planId]
        console.log(newPlan)
        newPlan.processes = newPlan.processes.map((p: any) => {
            if (p.id == process.id) {
                return process
            } else {
                return p
            }
        })
        console.log("NEW PLAN", newPlan)
        return { ...v, [newPlan.id]: newPlan };
    });
}

export function removeProcessCommitmentFromPlan(planId: string, processId: string, commitmentId: string) {
    fullPlans.update(v => {
        let newPlan = v[planId]
        newPlan.processes = newPlan.processes.map((p: any) => {
            if (p.id == processId) {
                p.commitments = p.commitments.filter((c: any) => c.id != commitmentId)
                return p
            } else {
                return p
            }
        })
        return { ...v, [newPlan.id]: newPlan };
    });
}