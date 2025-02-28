<script lang="ts">
    import { Pencil, Trash, EconomicEvent } from '$lib/icons'
    import { Decimal } from 'decimal.js'
    import { cloneDeep } from 'lodash'
    import { getPlan } from '../../../../crud/fetch'

    export let commitment;
    export let side;
    export let columnIndex;
    export let processIndex;
    export let allColumns;
    export let processes;
    export let planId;
    export let agents;
    export let economicResources;
    export let units;
    export let yellow;
    export let agreementsToDelete;
    export let commitmentsToDelete;
    export let fetching;
    export let carryOver;
    export let updateColumns;
    export let removeProcessCommitmentFromPlan;
    export let getProcess;
    export let deleteCommitment;
    export let deleteAgreement;
    export let buildPlan;
    export let commitmentModalOpen;
    export let commitmentModalProcess;
    export let commitmentModalColumn;
    export let commitmentModalSide;
    export let selectedCommitmentId;
    export let selectedProcessId;
    export let currentProcess;
    export let economicEventModalOpen;
    export let selectedCommitment;
    export let sumEconomicEventsFromFulfillments;
    // {#each committedInputs as { resourceConformsTo, providerId, resourceQuantity, action, receiverId, id, revisionId, agreement, fulfilledBy, finished, clauseOf, meta }}
    $: resourceConformsTo = commitment?.resourceConformsTo
    $: providerId = commitment?.providerId
    $: resourceQuantity = commitment?.resourceQuantity
    $: action = commitment?.action
    $: receiverId = commitment?.receiverId
    $: id = commitment?.id
    $: revisionId = commitment?.revisionId
    // $: agreement = commitment?.agreement
    $: fulfilledBy = commitment?.fulfilledBy
    $: finished = commitment?.finished
    $: clauseOf = commitment?.clauseOf
    // $: meta = commitment?.meta
    $: color = finished ? "#c4fbc4" : ((fulfilledBy && fulfilledBy.length > 0) ? "#fbfbb0" : "white")
    $: prevProcSpec = allColumns[columnIndex - 1]?.[0]?.basedOn?.id
    $: thisProcSpec = allColumns[columnIndex]?.[0]?.basedOn?.id
    $: carryOverInfo = carryOver[prevProcSpec]?.[resourceConformsTo?.id]
    $: outputCarryOverInfo = carryOver[thisProcSpec]?.[resourceConformsTo?.id]
    $: deficit = outputCarryOverInfo?.received - outputCarryOverInfo?.provided
    // $: dedupedFulfilledBy = fulfilledBy?.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)
    $: costColor = clause?.finished ? "#c4fbc4" : (((clause?.fulfilledBy && clause?.fulfilledBy.length > 0) || yellow.includes(id)) ? "#fbfbb0" : "white")
    $: clause = clauseOf?.commitments?.find(it => it.action.label == "transfer" && it.receiverId == providerId)
    // $: pickupFromOtherAgent = action?.label == "pickup" && providerId != receiverId
    // $: produce = action.label == "produce"
    // $: consume = action.label == "consume"
    // $: matchingResource = economicResources.find(it => it.conformsTo?.id == resourceConformsTo?.id)
</script>

    <!-- {JSON.stringify(prevProcSpec)} -->
    <!-- {JSON.stringify(processes.length)} -->
    <div
    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
    style="background-color: {color};
            border-radius: 0px 60px 60px 0px;
    ">
    <strong>{resourceConformsTo?.name}</strong>
    <div class="flex justify-between">
        <!--
        <p>
        {supply_driven_quantity?.hasNumericalValue}
        {supply_driven_quantity?.hasUnit?.label}
        </p>
        -->
        <p>
        {action.label}
        <!-- sum of all fulfilledby numericalvalues -->
            <!-- {JSON.stringify(fulfilledBy[0]?.fulfills)} -->
        <strong>
            {#if true && fulfilledBy && fulfilledBy.length > 0 && fulfilledBy[0].id}
            <!-- {sumEconomicEvents(fulfilledBy.map(it => it.id))} -->
            {sumEconomicEventsFromFulfillments(fulfilledBy)}
            {#each units as unit}
                {#if unit.id?.split(":")[0] == resourceQuantity.hasUnitId?.split(":")[0]}
                {unit.label}
                {/if}
            {/each}
            {:else}
            {new Decimal(resourceQuantity?.hasNumericalValue).toString()}
            <!-- {resourceQuantity?.hasUnit?.label} -->
            {#each units as unit}
                {#if unit.id?.split(":")[0] == resourceQuantity.hasUnitId?.split(":")[0]}
                {unit.label}
                {/if}
            {/each}
            {/if}
        </strong>
        </p>

        <!--
        <p>
        {demand_driven_quantity?.hasNumericalValue}
        {demand_driven_quantity?.hasUnit?.label}
        </p>
        -->
    </div>
    {#if carryOverInfo?.fromInventory > 0 && side == "committedInputs"}
        <p style="white-space: pre-wrap; word-wrap: break-word; color: green; font-weight: bold; background-color: #e0ffe0; padding: 2px 4px; border-radius: 4px; display: inline-block;">
        {carryOverInfo?.fromInventory} {resourceQuantity?.hasUnit?.label} in inventory
        </p>
    {/if}

    {#if side == "committedOutputs" && deficit > 0}
        <p style="white-space: pre-wrap; word-wrap: break-word; color: red; font-weight: bold; background-color: #ffe0e0; padding: 2px 4px; border-radius: 4px; display: inline-block;">
            {deficit} {resourceQuantity?.hasUnit?.label} deficit
        </p>
    {/if}
    <p>
        from 
        {#each agents as agent}
        {#if agent.id == providerId}
            {agent.name}
        {/if}
        {/each}
        <br />
        to 
        {#each agents as agent}
        {#if agent.id == receiverId}
            {agent.name}
        {/if}
        {/each}
        {#if fulfilledBy?.length > 0}
        {@const dedupedFulfilledBy = fulfilledBy.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)}
        <br />
        Economic Events: {dedupedFulfilledBy?.length}
        {/if}
    </p>
    {#if false && fulfilledBy && fulfilledBy.length > 0}
        <p>
        fulfilled by: {fulfilledBy[0]}
        finished: {finished}
        </p>
    {/if}
    <div class="w-full flex justify-center">
    <div style="margin-right: 20px; margin-top: 4px;">
    <!-- <div style="margin-right: 30px; margin-top: 4px;"> -->
        <!-- button to move commitment up in arra -->
        <button on:click={() => {
        let index = allColumns[columnIndex][processIndex][side].findIndex(it => it.id == id)
        if (index > 0) {
            let temp = allColumns[columnIndex][processIndex][side][index]
            allColumns[columnIndex][processIndex][side][index] = allColumns[columnIndex][processIndex][side][index - 1]
            allColumns[columnIndex][processIndex][side][index - 1] = temp
        }
        updateColumns(columnIndex, processIndex, side)
        }}>
        <img class="mx-auto" height="14px" width="14px" src="/arrow-up.svg" alt="" />
        </button>
        <!-- button to move down -->
        <button on:click={() => {
        let index = allColumns[columnIndex][processIndex][side].findIndex(it => it.id == id)
        if (index < allColumns[columnIndex][processIndex][side].length - 1) {
            let temp = allColumns[columnIndex][processIndex][side][index]
            allColumns[columnIndex][processIndex][side][index] = allColumns[columnIndex][processIndex][side][index + 1]
            allColumns[columnIndex][processIndex][side][index + 1] = temp
        }
        updateColumns(columnIndex, processIndex, side)
        }}>
        <img class="mx-auto" height="14px" width="14px" src="/arrow-down.svg" alt="" />
        </button>

    </div>

    <div style="margin-right: 20px; margin-top: 1px">
    <button
        on:click={() => {
        commitmentModalProcess = processIndex
        commitmentModalColumn = columnIndex
        commitmentModalSide = side
        selectedCommitmentId = id
        selectedProcessId = processes[processIndex]?.id
        currentProcess = allColumns?.[commitmentModalColumn]?.[commitmentModalProcess]?.[commitmentModalSide] ? [...allColumns?.[commitmentModalColumn]?.[commitmentModalProcess]?.[commitmentModalSide]] : []
        commitmentModalOpen = true
        }}
    >
        <Pencil/>
    </button>
    <button
        on:click={async () => {
        // visually remove commitment
        
        // remove cost agreement if present
        let costAgreement = clauseOf
        console.log("clauseOf to delete", costAgreement, costAgreement != undefined)

        if (side == "") {
            commitmentsToDelete.push(costAgreement.commitments.find(it => it.action.label == "transfer" && it.receiverId == providerId).revisionId)
        } else {
            await removeProcessCommitmentFromPlan(planId, allColumns[columnIndex][processIndex].id, id)
            await buildPlan()
        }
        if (costAgreement != undefined) {
            console.log("deleting cost agreement", costAgreement)
            agreementsToDelete.push(costAgreement.revisionId)
            commitmentsToDelete.push(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
            await deleteAgreement(costAgreement.revisionId)
            await deleteCommitment(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
        }
        // allColumns[columnIndex][processIndex][side] = allColumns[columnIndex][processIndex][side].filter(it => it.id != id)
        await deleteCommitment(revisionId)

        if (side == "") {
            await getPlan(planId)
        } else {
            await getProcess(allColumns[columnIndex][processIndex].id)
        }
        }}
    >
        <Trash />
    </button>
    </div>

    {#if true && revisionId}
        <button
        style="margin-top: -3px;"
        on:click={() => {
            // commitmentModalProcess = undefined
            // commitmentModalColumn = undefined
            // selectedProcessId = undefined
            // commitmentModalSide = ""
            // selectedCommitmentId = id
            // selectedCommitment = nonProcessCommitments.find(it => it.id == id)
            // console.log("selectedCommitmentId", selectedCommitmentId)
            // economicEventModalOpen = true
            if (side == "") {
                commitmentModalProcess = undefined
                commitmentModalColumn = undefined
                selectedProcessId = undefined
                commitmentModalSide = ""
                selectedCommitmentId = id
                selectedCommitment = commitment
            } else {
                commitmentModalProcess = processIndex
                commitmentModalColumn = columnIndex
                commitmentModalSide = side
                selectedCommitmentId = id
                console.log("selectedCommitmentId", selectedCommitmentId)
                selectedProcessId = processes[processIndex]?.id
                console.log("selectedProcessId", selectedProcessId)
                currentProcess = allColumns[commitmentModalColumn]?.[commitmentModalProcess]?.[commitmentModalSide] ? [...allColumns[commitmentModalColumn]?.[commitmentModalProcess]?.[commitmentModalSide]] : []
            }
            economicEventModalOpen = true
        }}
        >
        <EconomicEvent/>
        </button>
    {/if}
    </div>
    </div>

    {#if clauseOf}
    <!-- {@const clause = clauseOf?.commitments?.find(it => it.action.label == "transfer")} -->
    {#if clause}
    <!-- {@const costColor = clause?.finished ? "#c4fbc4" : (((clause?.fulfilledBy && clause?.fulfilledBy.length > 0) || yellow.includes(id)) ? "#fbfbb0" : "white")} -->
    <div
        class="bg-white rounded-r-full border border-gray-400 py-1 pl-8 pr-2 text-xs"
        style="background-color: {costColor};
            border-radius: 60px 0 0 60px;
        "
        >
            <p>
            <strong>
                transfer
                {#if true && clause?.fulfilledBy && clause?.fulfilledBy.length > 0 && clause?.fulfilledBy[0].id}
                {new Decimal(
                    sumEconomicEventsFromFulfillments(clause?.fulfilledBy)
                )
                .toFixed(2, Decimal.ROUND_HALF_UP)
                .toString()}
                {:else}
                {new Decimal(
                    clause?.resourceQuantity.hasNumericalValue
                )
                .toFixed(0, Decimal.ROUND_HALF_UP)
                .toString()}
                {/if}
                {clause?.resourceConformsTo.name}
            </strong>
            <br>from {agents.find(it => it.id == clause?.providerId)?.name} 
            <br>to {agents.find(it => it.id == clause?.receiverId)?.name}
            {#if clause?.fulfilledBy?.length > 0}
            {@const dedupedFulfilledBy = clause?.fulfilledBy.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)}
                <br />
                Economic Events: {dedupedFulfilledBy?.length}
            {/if}
            </p>
            <div style="display:flex;">
            <button
                style="margin-left: 12px;"
                on:click={() => {
                // commitmentModalProcess = processIndex
                // commitmentModalColumn = columnIndex
                // commitmentModalSide = side
                selectedCommitmentId = clause?.id
                // selectedProcessId = processes[processIndex]?.id
                // currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                selectedCommitment = cloneDeep(clause)
                commitmentModalOpen = true
                }}
            >
                <Pencil />
            </button>
            <button
                on:click={async () => {
                // visually remove commitment
                // allColumns[columnIndex][processIndex][side] = allColumns[columnIndex][processIndex].committedOutputs.filter(it => it.id != id)
                await deleteCommitment(clause?.id)
                console.log("deleted commitment", clause?.id)
                await deleteAgreement(clauseOf?.id)
                console.log("deleted agreement", clauseOf?.id)
                // const updateC = {
                //   revisionId: revisionId, 
                //   clauseOf: null,
                //   plannedWithin: planId,
                //   inputOf: processes[processIndex]?.id
                // }
                // console.log("updateC", updateC)
                // let uc = await updateCommitment(updateC)
                // console.log("UC", uc)
                fetching = true
                if (side == "") {
                    await getPlan(planId)
                } else {
                    await getProcess(allColumns[columnIndex][processIndex].id)
                }
                fetching = false
                }}
            >
                <Trash />
            </button>
            <button
                style="margin-left: 20px;"
                on:click={() => {
                commitmentModalProcess = undefined//processIndex
                commitmentModalColumn = undefined//columnIndex
                commitmentModalSide = undefined//side
                selectedCommitmentId = clause?.id
                selectedProcessId = undefined//processes[processIndex]?.id
                currentProcess = undefined//[...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                selectedCommitment = cloneDeep(clause)
                economicEventModalOpen = true
                }}
            >
                <EconomicEvent />
            </button>
            </div>

        </div>
        <!-- </div> -->
    {/if}
    {/if}