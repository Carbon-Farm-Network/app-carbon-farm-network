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
export const plansList = writable([]);
export const allFulfillments = writable([]);
export const allCommitments = writable([]);
export const allAgreements = writable([]);
export const allRecipes = writable([]);
export const allRecipeExchanges = writable([]);

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

export function setCommitments(newCommitments: any) {
    allCommitments.update(v => newCommitments);
}

export function setAgreements(newAgreements: any) {
    allAgreements.update(v => newAgreements);
}

export function addToFullPlans(newPlan: any) {
    fullPlans.update(v => {
        return { ...v, [newPlan.id]: newPlan };
    });
}

export function setPlansList(newPlans: any) {
    plansList.update(v => newPlans);
}

export function addNonProcessCommitmentsToPlan(planId: string, commitments: any[]) {
    fullPlans.update(v => {
        let newPlan = v[planId]
        newPlan.nonProcessCommitments = commitments
        return { ...v, [newPlan.id]: newPlan };
    });
}

export function updateProcessInPlan(process: any) {
    // console.log('updateProcessInPlan', process);
    const planId = process.plannedWithin.id;
    fullPlans.update(v => {
        // find the plan with the correct id
        // then replace the relevant process with the new one
        let newPlan = v[planId]
        // console.log(newPlan)
        newPlan.processes = newPlan.processes.map((p: any) => {
            if (p.id == process.id) {
                return process
            } else {
                return p
            }
        })
        // console.log("NEW PLAN", newPlan)
        return { ...v, [newPlan.id]: newPlan };
    });
}

export function removeProcessCommitmentFromPlan(planId: string, processId: string, commitmentId: string) {
    fullPlans.update(v => {
        let newPlan = v[planId]
        newPlan.processes = newPlan.processes.map((p: any) => {
            // console.log(p.id, processId)
            if (p.id == processId) {
                p.committedInputs = p.committedInputs.filter((c: any) => c.id != commitmentId)
                p.committedOutputs = p.committedOutputs.filter((c: any) => c.id != commitmentId)
                return p
            } else {
                return p
            }
        })
        return { ...v, [newPlan.id]: newPlan };
    });
}

export function removeNonProcessCommitmentFromPlan(planId: string, commitmentId: string) {
    fullPlans.update(v => {
        let newPlan = v[planId]
        newPlan.nonProcessCommitments = newPlan.nonProcessCommitments.filter((c: any) => c.id != commitmentId)
        return { ...v, [newPlan.id]: newPlan };
    });
}

export function addProcessCommitmentToPlan(planId: string, processId: string, inputOutput: any, commitment: any) {
    // console.log('addProcessCommitmentToPlan', planId, processId, inputOutput, commitment);
    fullPlans.update(v => {
        let newPlan = v[planId]
        newPlan.processes = newPlan.processes.map((p: any) => {
            if (p.id == processId) {
                p[inputOutput].push(commitment)
                return p
            } else {
                return p
            }
        })
        return { ...v, [newPlan.id]: newPlan };
    });
}

export function addNonProcessCommitmentToPlan(planId: string, commitment: any) {
    // console.log('addNonProcessCommitmentToPlan', planId, commitment);
    fullPlans.update(v => {
        let newPlan = v[planId]
        // console.log("new plan 0 " + JSON.stringify(newPlan.nonProcessCommitments.length))
        newPlan.nonProcessCommitments.push({
            ...commitment,
            stageId: commitment.stage
        })
        // console.log("new plan 1 " + JSON.stringify(newPlan.nonProcessCommitments.length))
        return { ...v, [newPlan.id]: newPlan };
    });
}

export function setRecipes(newRecipes: any) {
    allRecipes.update(v => newRecipes);
}

export function setRecipeExchanges(newRecipeExchanges: any) {
    allRecipeExchanges.update(v => newRecipeExchanges);
}