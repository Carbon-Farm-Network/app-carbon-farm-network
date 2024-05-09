<script lang="ts">
  import recipes from '$lib/data/recipes-with-exchanges.json'
  // import requests from '$lib/data/requests.json'
  // import offers from '$lib/data/offers.json'
  // import agents from '$lib/data/agents.json'
  import { Decimal } from 'decimal.js'
  import PlanModal from '$lib/PlanModal.svelte'
  import CommitmentModal from '$lib/CommitmentModal.svelte'
  import EconomicEventModal from '$lib/EconomicEventModal.svelte'
  import { Trash, Pencil, PlusCircle, EconomicEvent } from '$lib/icons'
  import { page } from '$app/stores';

  // import plan from '$lib/data/plan.json'
  import Header from '$lib/Header.svelte'
  import { goto } from '$app/navigation'
  import { gql } from 'graphql-tag'
  import { PROPOSAL_CORE_FIELDS, INTENT_CORE_FIELDS, PROPOSED_INTENT_CORE_FIELDS, PROPOSAL_RETURN_FIELDS } from '$lib/graphql/proposal.fragments'
  import { COMMITMENT_RETURN_FIELDS, PLAN_RETURN_FIELDS, PROCESS_RETURN_FIELDS, SIMPLIFIED_PLAN_RETURN_FIELDS } from '$lib/graphql/plan.fragments'
  import { RESOURCE_SPECIFICATION_CORE_FIELDS, UNIT_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'
  import { PROCESS_SPECIFICATION_CORE_FIELDS } from '$lib/graphql/process_specification.fragments'
  import { flattenRelayConnection } from '$lib/graphql/helpers'
  import { mutation, query } from 'svelte-apollo'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type { RelayConn } from '$lib/graphql/helpers'
  import type { ReadableQuery } from 'svelte-apollo'
  import type { Unit, AgentConnection, Agent, Action, Proposal, Plan, ProposalCreateParams, IntentCreateParams, IntentUpdateParams, UnitConnection, ResourceSpecification, ProcessSpecification, ProposalConnection, CommitmentConnection, ProposalUpdateParams, Intent, PlanCreateParams, PlanConnection, EconomicEventCreateParams, ProcessConnection, FulfillmentCreateParams } from '@valueflows/vf-graphql'
  import Export from "$lib/Export.svelte"
  import { dragscroll } from '@svelte-put/dragscroll';

  const delay = ms => new Promise(res => setTimeout(res, ms));
  let commitmentModalProcess: number | undefined;
  let commitmentModalColumn: number | undefined;
  let commitmentModalSide: string | undefined;
  let currentProcess: any[] | undefined;
  let commitmentsToDelete: string[] = []
  let agreementsToDelete: string[] = []
  let processesToLoadCount = 0;
  let processesLoadedCount = 0;
  let selectedProcessId: string | undefined = undefined;
  let error: any;
  let yellow: any[] = []
  let yellowAmounts: any = {}
  let units: Unit[] = []
  let actions: Action[] = []
  let agents: Agent[] = []
  let resourceSpecifications: ResourceSpecification[] = []
  let processSpecifications: ProcessSpecification[] = []
  let requestsPerOffer: { [key: string]: any } = {}

  let processImages = {
    "Pick Up": "/pickup.svg",
    "Ship": "/truck.svg",
    "Spin Yarn": "/socks.svg",
    "Scour Fiber": "/washing-machine.svg"
  }

  let planId = ''
  $: if ($page.params.plan_id) {
    planId = $page.params.plan_id;
  }

  $: allColumns, commitmentModalColumn, commitmentModalProcess, commitmentModalSide, currentProcess, commitmentModalOpen, economicEventModalOpen;

  let requests: Proposal[] = [];
  let offers: Proposal[] = [];
  let proposalsList: Proposal[] = []
  let plan: any;
  let loadingPlan: boolean = true;
  let allColumns: any = []
  $: loadingPlan, currentProcess

  const GET_UNITS = gql`
    query GetUnits {
      units {
        edges {
          cursor
          node {
            id
            label
            symbol
          }
        }
      }
    }
  `

  const GET_ALL_AGENTS = gql`
    query {
      agents(last: 100000) {
        edges {
          cursor
          node {
            id
            name
            classifiedAs
          }
        }
      }
    }
  `

  const GET_ALL_RESOURCE_SPECIFICATIONS = gql`
    ${RESOURCE_SPECIFICATION_CORE_FIELDS}
    ${UNIT_CORE_FIELDS}
    query {
      resourceSpecifications(last: 100000) {
        edges {
          cursor
          node {
            ...ResourceSpecificationCoreFields
            defaultUnitOfResource {
              ...UnitCoreFields
            }
          }
        }
      }
    }
  `

  const GET_ALL_PROCESS_SPECIFICATIONS = gql`
    ${PROCESS_SPECIFICATION_CORE_FIELDS}
    query {
      processSpecifications(last: 100000) {
        edges {
          cursor
          node {
            ...ProcessSpecificationCoreFields
          }
        }
      }
    }
  `


  const GET_All_PROPOSALS = gql`
    ${PROPOSAL_RETURN_FIELDS}
    query {
      proposals(last: 100000) {
        edges {
          cursor
          node {
            ...ProposalReturnFields
          }
        }
      }
    }
  `

  const GET_All_ACTIONS = gql`
    query {
      actions(last: 100000) {
        id
        label
        inputOutput
      }
    }
  `

  const GET_PLAN = gql`
    ${PLAN_RETURN_FIELDS}
    query GetPlan($id: ID!) {
      plan(id: $id) {
        ...PlanReturnFields
      }
    }
  `

  const GET_SIMPLIFIED_PLAN = gql`
    ${SIMPLIFIED_PLAN_RETURN_FIELDS}
    query GetPlan($id: ID!) {
      plan(id: $id) {
        ...SimplifiedPlanReturnFields
      }
    }
  `

  const GET_PROCESS = gql`
    ${PROCESS_RETURN_FIELDS}
    query GetProcess($id: ID!) {
      process(id: $id) {
        ...ProcessReturnFields
      }
    }
  `

  // const GET_COMMITMENT = gql`
  //   ${COMMITMENT_RETURN_FIELDS}
  //   query getCommitment($id: ID!) {
  //     commitment(id: $id) {
  //       ...CommitmentReturnFields
  //     }
  //   }
  // `

  const CREATE_ECONOMIC_EVENT = gql`
    mutation($event: EconomicEventCreateParams!) {
      createEconomicEvent(event: $event) {
        economicEvent {
          id
          revisionId
        }
      }
    }
  `

  const CREATE_FULFILLMENT = gql`
    mutation($fulfillment: FulfillmentCreateParams!) {
      createFulfillment(fulfillment: $fulfillment) {
        fulfillment {
          id
          revisionId
        }
      }
    }
  `

  const UPDATE_COMMITMENT = gql`
    mutation($commitment: CommitmentUpdateParams!) {
      updateCommitment(commitment: $commitment) {
        commitment {
          id
          revisionId
          plannedWithin {
            id
          }
        }
      }
    }
  `

  let addEconomicEvent: any = mutation(CREATE_ECONOMIC_EVENT)
  let addFulfillment: any = mutation(CREATE_FULFILLMENT)
  let updateCommitment: any = mutation(UPDATE_COMMITMENT)

  interface ProcessQueryResponse {
    processSpecifications: AgentConnection & RelayConn<any>
  }

  interface ProposalsQueryResponse {
    proposals: ProposalConnection & RelayConn<any>
  }

  interface PlanQueryResponse {
    plan: PlanConnection & RelayConn<any>
  }

  interface ProcessQueryResponse {
    process: ProcessConnection & RelayConn<any>
  }

  // interface CommitmentQueryResponse {
  //   commitment: CommitmentConnection & RelayConn<any>
  // }

  interface QueryResponse {
    agents: AgentConnection & RelayConn<any>
  }

  interface RspecResponse {
    resourceSpecifications: AgentConnection & RelayConn<any>
  }

  interface UnitsQueryResponse {
    units: UnitConnection & RelayConn<any> //& RelayConn<unknown> | null | undefined
  }

  // map component state
  let getUnits: ReadableQuery<UnitsQueryResponse> = query(GET_UNITS)
  let agentsQuery: ReadableQuery<QueryResponse> = query(GET_ALL_AGENTS)
  let resourceSpecificationsQuery: ReadableQuery<RspecResponse> = query(GET_ALL_RESOURCE_SPECIFICATIONS)
  let processSpecificationsQuery: ReadableQuery<QueryResponse> = query(GET_ALL_PROCESS_SPECIFICATIONS)
  let getProposals: ReadableQuery<ProposalsQueryResponse> = query(GET_All_PROPOSALS)
  let getActions: ReadableQuery<QueryResponse> = query(GET_All_ACTIONS)
  let getPlan: ReadableQuery<PlanQueryResponse> = query(GET_PLAN);
  let getSimplifiedPlan: ReadableQuery<PlanQueryResponse> = query(GET_SIMPLIFIED_PLAN);
  let getProcess: ReadableQuery<ProcessQueryResponse> = query(GET_PROCESS);
  // let getCommitment: ReadableQuery<CommitmentQueryResponse> = query(GET_COMMITMENT);

  async function fetchActions() {
    await getActions.getCurrentResult()
    let r = await getActions.refetch()
    console.log("*******actions*******")
    console.log(r)
    actions = r.data?.actions
  }

  async function fetchUnits() {
    getUnits.getCurrentResult()
    getUnits.refetch().then((r) => {
      if (r.data?.units.edges.length > 0) {
        units = flattenRelayConnection(r.data?.units)
      }
    })
  }

  async function fetchAgents() {
    await agentsQuery.getCurrentResult()
    const a = await agentsQuery.refetch()
    agents = flattenRelayConnection(a.data?.agents).map((a) => {
      return {
        ...a,
      }
    })
    console.log("AGENTS", agents)
  }

  async function fetchResourceSpecifications() {
    await resourceSpecificationsQuery.getCurrentResult()
    let r = await resourceSpecificationsQuery.refetch()
    resourceSpecifications = flattenRelayConnection(r.data?.resourceSpecifications).map((a) => {
      return {
        ...a,
        // defaultUnitOfResourceId: a.defaultUnitOfResource?.id,
      }
    })
    console.log(resourceSpecifications)
  }

  async function fetchProcessSpecifications() {
    await processSpecificationsQuery.getCurrentResult()
    let r = await processSpecificationsQuery.refetch()
    processSpecifications = flattenRelayConnection(r.data?.processSpecifications).map((a) => {
      return {
        ...a,
      }
    })
    console.log(processSpecifications)
  }

    
  async function fetchProposals() {
    try {
      await getProposals.getCurrentResult()
      await getProposals.refetch().then((r) => {
        if (r.data?.proposals.edges.length > 0) {
          proposalsList = flattenRelayConnection(r.data?.proposals)
          console.log("HERE ARE PROPOSALS", proposalsList)
          // {@const primary = publishes.find(it => !it.reciprocal)}
          //       {#if primary?.publishes?.receiver}
          requests = proposalsList.filter(it => it.publishes?.find(it => it.reciprocal)?.publishes?.receiver)
          offers = proposalsList.filter(it => it.publishes?.find(it => !it.reciprocal)?.publishes?.provider)
          console.log("offers here", offers)
          // console.log(requests)
          // console.log(offers)
          // console.log(proposalsList[0].publishes[0].publishes)
          // console.log(requests)
          // requestsPerOffer = offers.map(it => it.publishes.find(it => !it.reciprocal).id).reduce((acc, it) => {
          //   acc[it] = {}
          //   return acc
          // }, {})
        }
      })
    } catch (e) {
      console.log(e)
      error = e
    }
  }

  async function saveCommitment(commitment: any) {
    try {
      console.log("commitment!", commitment)
      let x = await updateCommitment({
        variables: {
          commitment: {
            revisionId: commitment.revisionId,
            finished: commitment.finished,
          },
        }
      })
      console.log(x)
    } catch (e) {
      console.log(e)
    }
  }

  async function includeCommitment(commitment: Commitment) {
    try {
      // if primary intent, add to requestsPerOffer
      if (commitment.clauseOf) {
        // console.log("primary intent candidates", offers)
        const matching_offer = offers.find(offer => {
          return offer.publishes.find(
            intent => {
              const offerName = intent.publishes?.resourceConformsTo?.name
              // console.log(offerName, " ==?", commitment.resourceConformsTo.name)
              const correctProvider = commitment.providerId ? (intent.publishes?.providerIid == commitment.providerIid) : true
              return offerName == commitment.resourceConformsTo.name && correctProvider
            }
          )
        })

        // console.log("primary intent candidates matches", matching_offer)

        const primary_intent = matching_offer?.publishes.find(
          intent => !intent.reciprocal
        )
        
        // console.log("candidate primary intent", primary_intent)
        
        if (!requestsPerOffer[primary_intent.id]) {
          requestsPerOffer[primary_intent.id] = {}
        }
        
        if (commitment.action.label == "pickup") {
          requestsPerOffer[primary_intent.id][commitment.id] = new Decimal(commitment.resourceQuantity.hasNumericalValue)
        }
        console.log("requests per offer ... ", requestsPerOffer)
      }
    } catch (e) {
      console.log("include commitment error", e)
    }
  }

  // async function fetchCommitment(id: string) {
  //   try {
  //     console.log("getting commitment", id)
  //     getCommitment.setVariables({
  //       id: id
  //     });
  //     const res = await getCommitment.refetch()
  //     console.log(res)
  //     // if primary intent, add to requestsPerOffer
  //     let commitment = res.data.commitment
  //     if (commitment.clauseOf) {
  //       console.log("primary intent candidates", offers)
  //       const matching_offer = offers.find(offer => {
  //         return offer.publishes.find(
  //           intent => {
  //             const offerName = intent.publishes?.resourceConformsTo?.name
  //             // console.log(offerName, " ==?", commitment.resourceConformsTo.name)
  //             const correctProvider = commitment.provider ? (intent.publishes?.provider?.id == commitment.provider?.id) : true
  //             return offerName == commitment.resourceConformsTo.name && correctProvider
  //           }
  //         )
  //       })

  //       const primary_intent = matching_offer?.publishes.find(
  //         intent => !intent.reciprocal
  //       )
        
        
  //       if (!requestsPerOffer[primary_intent.id]) {
  //         requestsPerOffer[primary_intent.id] = {}
  //       }
        
  //       console.log("res", commitment)
  //       console.log("adding ", commitment.resourceQuantity.hasNumericalValue)
  //       if (commitment.action.label == "pickup") {
  //         requestsPerOffer[primary_intent.id][commitment.id] = new Decimal(commitment.resourceQuantity.hasNumericalValue)
  //       }
  //       console.log(requestsPerOffer)
  //     }
  //     return res.data.commitment
  //   } catch (e) {
  //     console.log(e)
  //   }
  // }

  async function saveEconomicEvent(commitment: any, process: any, side: string) {
    try {
      console.log("commitment: ", commitment)
      const economicEvent: EconomicEventCreateParams = {
        // note: commitment.note,
        action: commitment.action.id,
        provider: commitment.providerId,
        receiver: commitment.receiverId,
        // hasPointInTime: new Date(),
        // resourceClassifiedAs: ["commitment.resourceConformsTo.id"],
        resourceConformsTo: commitment.resourceConformsTo.id,
        resourceQuantity: {
          hasNumericalValue: commitment.resourceQuantity.hasNumericalValue,
          hasUnit: commitment.resourceQuantity.hasUnitId,
        },
        hasBeginning: new Date(),
        // inScopeOf: ['some-accounting-scope'],
      }

      console.log("economic event", economicEvent)

      if (side == "committedInputs") {
        economicEvent.inputOf = process
      } else if (side == "committedOutputs"){
        economicEvent.outputOf = process
      }

      console.log("economic event", economicEvent)
      
      let x = await addEconomicEvent({
        variables: {
          event: economicEvent,
        }
      })
      console.log(x)

      const fulfillment: FulfillmentCreateParams = {
        fulfilledBy: x.data.createEconomicEvent.economicEvent.id,
        fulfills: commitment.id,
      }

      console.log("fulfillment", fulfillment)
      let y = await addFulfillment({
        variables: {
          fulfillment: fulfillment,
        }
      })
      console.log("y", y)

      await saveCommitment(commitment)
    } catch (e) {
      console.log(e)
    }
  }

  function makeAgreement(
    commitment: any,
    agreement: undefined | any,
    offers: any[]
  ): undefined | any {
    // const reciprocal_clause = recipe?.has_recipe_reciprocal_clause?.[0]
    // if (!reciprocal_clause) return
    // let numerical_value = reciprocal_clause.resourceQuantity.hasNumericalValue
    // let hasUnit = reciprocal_clause.resourceQuantity.hasUnit
    let specific_provider = commitment.provider
    console.log("specific provider", specific_provider)
    let numerical_value;
    let hasUnit;
    let reciprocal_intent;
    let primary_intent;
    // TODO get data to test the matching offer logic
    const matching_offer = offers.find(offer => {
      return offer.publishes.find(
        intent => {
          const offerName = intent.publishes?.resourceConformsTo?.name
          // console.log(offerName, " ==?", commitment.resourceConformsTo.name)
          const correctProvider = specific_provider? (intent.publishes?.provider?.id == specific_provider?.id) : true
          return offerName == commitment.resourceConformsTo.name && correctProvider
        }
      )
    })
    // console.log("matching offer 0", matching_offer)
    if (matching_offer) {
      // console.log("matching offer", matching_offer)
      reciprocal_intent = matching_offer.publishes.find(
        intent => intent.reciprocal
      )
      primary_intent = matching_offer.publishes.find(
        intent => !intent.reciprocal
      )
      console.log("TEMP", reciprocal_intent?.publishes?.resourceQuantity?.hasNumericalValue, primary_intent?.publishes?.resourceQuantity?.hasNumericalValue)
      numerical_value = reciprocal_intent.publishes?.resourceQuantity.hasNumericalValue / primary_intent.publishes?.resourceQuantity.hasNumericalValue
      console.log("numerical value", numerical_value)
      console.log(new Decimal(numerical_value)
            .mul(commitment.resourceQuantity.hasNumericalValue)
            .toDecimalPlaces(0, Decimal.ROUND_UP)
            .toString()
            )
      console.log("has unit?", primary_intent)
      // hasUnit = reciprocal_intent.publishes?.resourceQuantity
      hasUnit = primary_intent.publishes?.resourceQuantity?.hasUnit
      // units.forEach((unit) => {
      //   if (unit.id == primary_intent.publishes?.resourceQuantity?.hasUnitId) {
      //     hasUnit = unit
      //   }
      // })
      // console.log(numerical_value, hasUnit)
      // console.log("made agreement", reciprocal_intent.publishes?.resourceConformsTo?.name, numerical_value, hasUnit)
    } else {
      return
    }

    console.log("numerical value", numerical_value, hasUnit)
    if (!numerical_value || !hasUnit) return

    if (!requestsPerOffer[primary_intent.id]) {
      requestsPerOffer[primary_intent.id] = {}
    }
    if (commitment.action.label == "pickup") {
      console.log("*****pickup*****", commitment.resourceQuantity.hasNumericalValue)
      requestsPerOffer[primary_intent.id][commitment.id] = new Decimal(commitment.resourceQuantity.hasNumericalValue)
    }

    // return {
    //   name: agreement?.name,
    //   note: agreement?.note,
    //   commitment: {
    //     action:  reciprocal_intent?.publishes?.action?.label,
    //     provider: reciprocal_intent?.publishes?.receiver,
    //     // stage: reciprocal_clause?.stage,
    //     resourceConformsTo: reciprocal_intent?.publishes?.resourceConformsTo,
    //     resourceQuantity: {
    //       hasNumericalValue: new Decimal(numerical_value)
    //         .mul(commitment.resourceQuantity.hasNumericalValue)
    //         .toDecimalPlaces(0, Decimal.ROUND_UP)
    //         .toString(),
    //       hasUnit: hasUnit
    //     }
    //   }
    // }

    return {
      commitments: [
      {
        action: {
          label: reciprocal_intent?.publishes?.action?.label
        },
        provider: reciprocal_intent?.publishes?.receiverId,
        // stage: reciprocal_clause?.stage,
        resourceConformsTo: reciprocal_intent?.publishes?.resourceConformsTo,
        resourceQuantity: {
          hasNumericalValue: new Decimal(numerical_value)
            .mul(commitment.resourceQuantity.hasNumericalValue)
            .toDecimalPlaces(0, Decimal.ROUND_UP)
            .toString(),
          hasUnit: hasUnit
        }
      }]
    }
  }

  onMount(async () => {
    if (browser) {
      try {
        if (false) {
          getPlan.setVariables({
            id: planId
          });
          const res = await getPlan.refetch()
          console.log(res)
          plan = {...res.data.plan}
          commitments = [...plan.independentDemands]
          console.log("plan", plan)
          console.log("commitments", commitments)
          let lastSeenProcessSpecification: any = undefined;
          let lastColumn: any = []
          allColumns = []
          plan.processes.forEach((process: any) => {
            const newProcess = {
              ...process,
              basedOn: {
                image: processImages[process.basedOn.name],
                name: process.basedOn.name,
                id: process.basedOn.id,
              },
              // sort committedInputs by last modified
              committedInputs: [...process.committedInputs].sort((a, b) => new Date(a.meta.retrievedRevision.time).getTime() - new Date(b.meta.retrievedRevision.time).getTime()),
              // committedInputs: [...process.committedInputs].reverse(),
              committedOutputs: [...process.committedOutputs].sort((a, b) => new Date(a.meta.retrievedRevision.time).getTime() - new Date(b.meta.retrievedRevision.time).getTime()),
              
            }
            console.log("PROCESS TYPE", process.basedOn.name, newProcess)
            
            // if this is a new process
            if (process.basedOn.id !== lastSeenProcessSpecification) {
              console.log("NEW PROCESS", process.basedOn.name)
              // add last column to allColumns and reset
              if (lastColumn.length > 0) {
                console.log("LAST COLUMN FULL", lastColumn)
                allColumns.unshift(lastColumn)
                lastColumn = [newProcess]
              } else {
                console.log("LAST COLUMN NOT FULL", lastColumn)
                lastColumn.unshift(newProcess)
              }
              lastSeenProcessSpecification = process.basedOn.id
            } else {
              console.log("SAME PROCESS", process.basedOn.name)
              lastColumn.unshift(newProcess)
            }

            allColumns.unshift(lastColumn)
            loadingPlan = false;
            console.log("allColumns", allColumns)
            allColumns = [...allColumns]
          })
          console.log(allColumns)
        } else {
        // console.log(GET_PLAN)
        // console.log(planId)
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++")
      // getPlan.setVariables({
        //   id: planId
        // });
        await fetchActions()
        await delay(1000)
        await fetchUnits()
        await delay(1000)
        await fetchAgents()
        await delay(1000)
        await fetchResourceSpecifications()
        await delay(1000)
        await fetchProcessSpecifications()
        await delay(1000)
        await fetchProposals()
        await delay(1000)

        console.log("HERE ARE OFFERS", offers)

        getSimplifiedPlan.setVariables({
          id: planId
        });
        // const res = await getPlan.refetch()
        const res = await getSimplifiedPlan.refetch()

        plan = {...res.data.plan}

        console.log("HERE IS THE PLAN", plan)

        commitments = [...plan.independentDemands]
        
        let lastSeenProcessSpecification: any = undefined;
        let lastColumn: any = []
        // plan.processes.forEach((process: any) => {
          // for (let i = 0; i < simplifiedPlan.processes.length; i++) {
            processesToLoadCount = plan.processes.length
            for (const p of plan.processes) {
              getProcess.setVariables({
            id: p.id
          });
          let processRes: any = await getProcess.refetch()
          processesLoadedCount++
          let process = {...processRes.data.process}
          console.log(process)
          // await delay(1000)
          // console.log(JSON.stringify(process.basedOn))
          // console.log(allColumns)
          // console.log(process)
          // try to get basedOn for each commitment

          for (const commitment of process.committedOutputs) {
            console.log("commitment: ", commitment)
            // const fullCommitment = await fetchCommitment(commitment.id)
            await includeCommitment(commitment)
            // if (fullCommitment) {
              // commitment.clauseOf = fullCommitment.clauseOf
              // replace commitment with fullCommitment in the process
              process.committedOutputs = [...process.committedOutputs.map(it => it.id == commitment.id ? {...it, clauseOf: commitment.clauseOf} : it)]
            // }
            console.log("cost commitment: ", commitment)
            // await delay(100)
          }

          for (const commitment of process.committedInputs) {
            console.log("commitment: ", commitment)

            await includeCommitment(commitment)
            
            // const fullCommitment = await fetchCommitment(commitment.id)
            // if (fullCommitment) {
              // commitment.clauseOf = fullCommitment.clauseOf
              // replace commitment with fullCommitment in the process
              process.committedInputs = [...process.committedInputs.map(it => it.id == commitment.id ? {...it, clauseOf: commitment.clauseOf} : it)]
            // }
            console.log("cost commitment: ", commitment)
            // await delay(100)
          }

          const newProcess = {
            ...process,
            basedOn: {
              image: processImages[process.basedOn.name],
              name: process.basedOn.name,
              id: process.basedOn.id,
            },
            // sort committedInputs by last modified
            committedInputs: [...process.committedInputs].sort((a, b) => new Date(a.meta.retrievedRevision.time).getTime() - new Date(b.meta.retrievedRevision.time).getTime()),
            // committedInputs: [...process.committedInputs].reverse(),
            committedOutputs: [...process.committedOutputs].sort((a, b) => new Date(a.meta.retrievedRevision.time).getTime() - new Date(b.meta.retrievedRevision.time).getTime()),
          }

          console.log("PROCESS TYPE", process.basedOn.name, newProcess)

          // if this is a new process
          if (process.basedOn.id !== lastSeenProcessSpecification) {
            console.log("NEW PROCESS", process.basedOn.name)
            // add last column to allColumns and reset
            if (lastColumn.length > 0) {
              console.log("LAST COLUMN FULL", lastColumn)
              allColumns.unshift(lastColumn)
              lastColumn = [newProcess]
            } else {
              console.log("LAST COLUMN NOT FULL", lastColumn)
              lastColumn.unshift(newProcess)
            }
            lastSeenProcessSpecification = process.basedOn.id
          } else {
            console.log("SAME PROCESS", process.basedOn.name)
            lastColumn.unshift(newProcess)
          }
          console.log(lastColumn)
        }
        
        allColumns.unshift(lastColumn)
        loadingPlan = false;
        console.log("allColumns", allColumns)
        allColumns = [...allColumns]
      }
      } catch (e) {
        console.log("error", e)
        error = e
      }
    }
  })


  // ===========================================

  type Commitment = {
    resourceConformsTo: { name: string }
    resourceQuantity: { hasNumericalValue: string; hasUnit: { label: string } }
    receiver: { name: string }
    action: string
    id: string
  }
  let commitments: any[] = []

  let planModalOpen = false
  let commitmentModalOpen = false
  let economicEventModalOpen = false
  let selectedCommitmentId: string | undefined = undefined

  let totalCost: Decimal = new Decimal(0);
  $: if (allColumns) {
    totalCost = new Decimal(0)
    for (let i = 0; i < allColumns.length; i++) {
      console.log("column", i)
      console.log(allColumns[i])
      for (let j = 0; j < allColumns[i].length; j++) {
        console.log("process", j)
        let inputsAndOutputs = allColumns[i][j].committedInputs.concat(allColumns[i][j].committedOutputs)
        for (let k = 0; k < inputsAndOutputs.length; k++) {
          console.log("cost", inputsAndOutputs[k])
          console.log("clauseOf", inputsAndOutputs[k].clauseOf)
          if (inputsAndOutputs[k].clauseOf) {
            const addedValue = new Decimal(inputsAndOutputs[k].clauseOf.commitments.find(it => it.action.label == "transfer").resourceQuantity.hasNumericalValue)
            totalCost = totalCost.add(addedValue)
          }
        }
      }
    }
    console.log("total cost", totalCost.toString())
  }
</script>

<!-- {JSON.stringify(aggregatedCommitments)} -->

{#if plan}
<PlanModal bind:open={planModalOpen} planObject = 
  {plan} 
  {allColumns} 
  {commitments} 
  {commitmentsToDelete}
  {units}
  {agents}
  {resourceSpecifications}
  {processSpecifications}
editing={true}/>
{/if}

{#if economicEventModalOpen}
<EconomicEventModal
bind:open={economicEventModalOpen}
  {selectedCommitmentId}
  {commitmentModalProcess}
  {commitmentModalColumn}
  {commitmentModalSide}
  {units}
  {agents}
  {resourceSpecifications}
  {processSpecifications}
  process = {currentProcess}
  bind:commitments
  on:submit={(event) => {
    console.log("economic event: ", event.detail.commitment)
    saveEconomicEvent(event.detail.commitment, selectedProcessId, commitmentModalSide)
    let indexOfCommitment = allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide].findIndex(it => it.id == event.detail.commitment.id)
    console.log(event.detail)
    if (event.detail.commitment.finished) {
      console.log("yes")
      yellow = yellow.filter(it => it != event.detail.commitment.id)
    } else {
      yellow.push(event.detail.commitment.id)
      if (yellowAmounts[event.detail.commitment.id]) {
        yellowAmounts[event.detail.commitment.id] = yellowAmounts[event.detail.commitment.id] + event.detail.commitment.resourceQuantity.hasNumericalValue
      } else {
        yellowAmounts[event.detail.commitment.id] = event.detail.commitment.resourceQuantity.hasNumericalValue
      }
      // add all economic event amounts to yellowAmounts
      
      console.log("no")
    }
    console.log("finished", event.detail.commitment.finished)
    allColumns[event.detail.column][event.detail.process][event.detail.side][indexOfCommitment] = event.detail.commitment
  }}
/>
{/if}

<CommitmentModal
  bind:open={commitmentModalOpen}
  {selectedCommitmentId}
  {commitmentModalProcess}
  {commitmentModalColumn}
  {commitmentModalSide}
  {units}
  {actions}
  {agents}
  {resourceSpecifications}
  process = {currentProcess}
  bind:commitments
  on:submit={(event) => {
    console.log(allColumns)
    console.log("commitment submit event", event)
    // console.log(JSON.stringify(allColumns[event.detail.column][event.detail.process][event.detail.side][0].id))
    console.log("ID: ", event.detail.commitment.id)
    if (event.detail.useAs == "update") {
      if (event.detail.column == undefined) {
        commitments = commitments.map(it => it.id == event.detail.commitment.id ? event.detail.commitment : it)
        commitments = [...commitments]
      } else {

        // get cost
        let costAgreement = event.detail.commitment.clauseOf //.commitments.map(it => it.id == event.detail.commitment.id ? event.detail.commitment : {...it, provider: event.detail.commitment.receiver, receiver: event.detail.commitment.provider} )
        console.log("cost agreement 1", costAgreement)
        // check if provider changed, and if so, update the cost
        // let providerChanged = false;
        // try {
        //   providerChanged = event.detail.commitment.provider?.id != allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide].find(it => it.id == event.detail.commitment.id)?.provider?.id
        // } catch (e) {
        //   console.log(e)
        // }
        // console.log("provider changed? ", providerChanged, event.detail.commitment.provider)
        if (event.detail.saveCost) {
          if (costAgreement) {
            agreementsToDelete.push(costAgreement.revisionId)
            commitmentsToDelete.push(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
          }
          costAgreement = makeAgreement(event.detail.commitment, costAgreement, offers)
        }
        // possible cost update ends

        let updatedCommitment = {
          ...event.detail.commitment,
        }

        console.log("cost agreement 2", costAgreement)
        if (costAgreement) {
          updatedCommitment.clauseOf = costAgreement
        }

        console.log("updated commitment", updatedCommitment)
        let commitmentIndex = allColumns[event.detail.column][event.detail.process][event.detail.side].findIndex(it => it.id == event.detail.commitment.id)
        allColumns[event.detail.column][event.detail.process][event.detail.side][commitmentIndex] = updatedCommitment
      }
    } else {
      console.log(event.detail)
      if (event.detail.column == undefined) {
        commitments.push(event.detail.commitment)
        commitments = [...commitments]
      } else {
        console.log("adding commitment", event.detail.commitment)
        if (event.detail.saveCost) {
          let costAgreement = makeAgreement(event.detail.commitment, undefined, offers)
          console.log("cost agreement", costAgreement)
          if (costAgreement) {
            event.detail.commitment.clauseOf = costAgreement
          }
        }
        allColumns[event.detail.column][event.detail.process][event.detail.side].push(event.detail.commitment)
      }
    }

    allColumns = [...allColumns]
    // console.log(allColumns[event.detail.column][event.detail.process][event.detail.side])

    // reset form
    selectedCommitmentId = undefined
    commitmentModalProcess = undefined
    commitmentModalColumn = undefined
    commitmentModalSide = undefined
  }}
/>
<!-- custom header introduced to enable planning to be more inline with the beginning of the page -->
<div class="custom-background" style="height: 15vh">
  <div class="mx-auto px-2 sm:px-6 lg:px-8">
    <h2 class="pt-1 text-white text-3xl">Planning</h2>
    <p class="text-white text-xs">
      Creating and modifying a plan, and recording actual activity
    </p>
  </div>
</div>


{#if loadingPlan}
Loading processes ({processesLoadedCount}/{processesToLoadCount + 1})
{#if error}
  <br>
  {error}
{/if}
{:else}
<!-- plan name -->
<!-- plan name -->
<h1 class="text-center text-xl font-semibold">{plan.name}</h1>
{@const exportData = {
  plan: plan,
  allColumns: allColumns,
  commitments: commitments,
}}
<div class="flex justify-center items-center">
  <!-- <div class="outer-div justify-center items-center">
  <div class="scroll-div justify-center items-center">
  <div class="content-div flex space-x-8 mx-4"> -->
  <!-- <div class="flex space-x-8 mx-4 overflow-x-scroll"> -->
  <div class="flex space-x-8 mx-4 overflow-x-scroll overflow-y-scroll" style="height: calc(100vh - 172px)" use:dragscroll={{ axis: 'both' }}>

    <div class="min-w-[250px]">
      <div class="flex justify-center" style="margin-top: 22px; margin-bottom: 22px">
        <button
          type="button"
          on:click={() => {
            planModalOpen = true
            // plan_created = true
          }}
          class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >Save changes</button
        >
        <Export dataName="plan" fileName="cfn-plan-{plan.name}" data={exportData} />
      </div>
      <h2 class="text-center text-xl font-semibold">Offers</h2>
      <div class="bg-blue-300 border border-gray-400 p-2" style="background-color: #8C8C8C;">
        <!-- Sub-columns -->
        <div class="">
          <div>
            {#each proposalsList as { publishes }}
              {@const reciprocal = publishes?.find(it => it.reciprocal)}
              {@const primary = publishes?.find(it => !it.reciprocal)}
              {@const requestsTotalAll = requestsPerOffer[primary?.id]}
              {@const requestsTotal = requestsTotalAll ? Object.values(requestsTotalAll).map(it => new Decimal(it)).reduce((acc, it) => acc.add(it), new Decimal(0)) : new Decimal(0)}
              <!-- {@const requestsTotal = requestsPerOffer[primary?.id]} -->
              <!-- {JSON.stringify(requestsTotalAll)} -->
              {#if primary?.publishes?.provider}
                <div
                  class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                >
                  <p>{primary?.publishes?.resourceConformsTo?.name}</p>
                  {#if primary?.publishes?.availableQuantity}
                  <p>
                    {#if primary?.publishes?.availableQuantity?.hasNumericalValue && primary?.publishes?.availableQuantity?.hasNumericalValue > 0}
                      {primary?.publishes?.availableQuantity?.hasNumericalValue}
                      {#each units as unit}
                        {#if unit.id == primary?.publishes?.availableQuantity?.hasUnitId}
                          {unit.label}
                        {/if}
                      {/each}
                       available<br>
                      <span style="color: {(requestsTotal  > primary?.publishes?.availableQuantity?.hasNumericalValue) ? 'red' : ''
                        }">
                        {requestsTotal} requested<br>
                        <!-- {requestsTotal} of {primary?.publishes?.availableQuantity?.hasNumericalValue} requested<br> -->
                      </span>
                    {/if}
                    {reciprocal?.publishes?.resourceQuantity?.hasNumericalValue}
                    {reciprocal?.publishes?.resourceConformsTo?.name} per {primary?.publishes?.resourceQuantity?.hasNumericalValue} 
                    <!-- {primary?.publishes?.resourceQuantity?.hasUnit?.label} -->
                    {#each units as unit}
                      {#if unit.id == primary?.publishes?.resourceQuantity?.hasUnitId}
                        {unit.label}
                      {/if}
                    {/each}
                  </p>
                  {:else}
                    <p>
                      {reciprocal?.publishes?.resourceQuantity?.hasNumericalValue}
                      USD per lb
                    </p>
                  {/if}
                  <p>from 
                    <!-- {primary?.publishes?.provider?.name} -->
                    {#each agents as agent}
                      {#if agent.id == primary?.publishes?.provider.id}
                        {agent.name}
                      {/if}
                    {/each}
                  </p>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>  
    </div>

    <!-- Main Columns -->
    <!-- {JSON.stringify(allColumns[0])} -->
    <!-- {#each allColumns as processes}
      {@const { image, name } = processes[0].basedOn}
      {JSON.stringify(name)}
    {/each} -->
    {#each allColumns as processes, columnIndex}
    {@const { image, name } = processes[0].basedOn}
    <div class="min-w-[420px]">
      <img class="mx-auto" height="80px" width="80px" src={image} alt="" />
      <h2 class="text-center text-xl font-semibold">{name}</h2>
      {#each processes as { committedInputs, committedOutputs }, processIndex}

      <!-- <div class="bg-gray-400 border border-gray-400 p-2"> -->
      <div class="border-gray-400 p-2" style="background-color: #BFBFBF;">
        <!-- Sub-columns -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <button
            class="flex justify-center items-center w-full mb-2"
            on:click={() => {
              commitmentModalProcess = processIndex
              commitmentModalColumn = columnIndex
              commitmentModalSide = "committedInputs"
              commitmentModalOpen = true
              selectedCommitmentId = undefined
            }}
                >
                <PlusCircle />
              </button>
                {#each committedInputs as { resourceConformsTo, providerId, resourceQuantity, action, receiverId, id, revisionId, agreement, fulfilledBy, finished, clauseOf, meta }}
                  {@const color = finished ? "#c4fbc4" : (((fulfilledBy && fulfilledBy.length > 0) || yellow.includes(id)) ? "#fbfbb0" : "white")}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                    style="background-color: {color};"
                    >
                    <p>{resourceConformsTo?.name}</p>
                    <!-- <p>{id}</p> -->
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
                        {#if fulfilledBy && fulfilledBy.length > 0 && fulfilledBy[0].id}
                          {@const yellowAmount = yellowAmounts[id] || 0}
                          {@const amount = fulfilledBy.map(it => it.fulfilledBy.resourceQuantity.hasNumericalValue).reduce((acc, it) => new Decimal(acc).add(it), new Decimal(0)).toString()}
                          {new Decimal(amount).add(yellowAmount).toString()}
                          {fulfilledBy[0].fulfilledBy.resourceQuantity.hasUnit.label}
                        {:else if yellowAmounts[id]}
                          {yellowAmounts[id]}
                          <!-- {resourceQuantity?.hasUnit?.label} -->
                          {#each units as unit}
                            {#if unit.id == resourceQuantity.hasUnitId}
                              {unit.label}
                            {/if}
                          {/each}
                        {:else}
                          {new Decimal(resourceQuantity?.hasNumericalValue).toString()}
                          <!-- {resourceQuantity?.hasUnit?.label} -->
                          {#each units as unit}
                            {#if unit.id == resourceQuantity.hasUnitId}
                              {unit.label}
                            {/if}
                          {/each}
                        {/if}
                      </p>
                      <!--
                      <p>
                        {demand_driven_quantity?.hasNumericalValue}
                        {demand_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                    </div>
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
                    </p>
                    {#if clauseOf}
                      {@const clause = clauseOf.commitments.find(it => it.action.label == "transfer")}
                      {#if clause}
                        <p>
                          cost {new Decimal(
                            clause.resourceQuantity.hasNumericalValue
                          )
                            .toFixed(2, Decimal.ROUND_HALF_UP)
                            .toString()}
                          {clause.resourceConformsTo.name}
                        </p>
                      {/if}
                    {/if}
                    {#if false && fulfilledBy && fulfilledBy.length > 0}
                      <p>
                        fulfilled by: {fulfilledBy[0]}
                        finished: {finished}
                      </p>
                    {/if}
                    <div class="w-full flex" style="margin-right: 10px">

                    <div style="margin-right: 20px; margin-top: 4px;">
                      <!-- button to move commitment up in arra -->
                      <button on:click={() => {
                        let index = allColumns[columnIndex][processIndex].committedInputs.findIndex(it => it.id == id)
                        if (index > 0) {
                          let temp = allColumns[columnIndex][processIndex].committedInputs[index]
                          allColumns[columnIndex][processIndex].committedInputs[index] = allColumns[columnIndex][processIndex].committedInputs[index - 1]
                          allColumns[columnIndex][processIndex].committedInputs[index - 1] = temp
                        }
                      }}>
                        <img class="mx-auto" height="14px" width="14px" src="/arrow-up.svg" alt="" />
                      </button>
                      <!-- button to move down -->
                      <button on:click={() => {
                        let index = allColumns[columnIndex][processIndex].committedInputs.findIndex(it => it.id == id)
                        if (index < allColumns[columnIndex][processIndex].committedInputs.length - 1) {
                          let temp = allColumns[columnIndex][processIndex].committedInputs[index]
                          allColumns[columnIndex][processIndex].committedInputs[index] = allColumns[columnIndex][processIndex].committedInputs[index + 1]
                          allColumns[columnIndex][processIndex].committedInputs[index + 1] = temp
                        }
                      }}>
                        <img class="mx-auto" height="14px" width="14px" src="/arrow-down.svg" alt="" />
                      </button>

                    </div>

                    <div style="margin-right: 20px; margin-top: 1px">
                    <button
                      on:click={() => {
                        commitmentModalProcess = processIndex
                        commitmentModalColumn = columnIndex
                        commitmentModalSide = "committedInputs"
                        selectedCommitmentId = id
                        currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                        commitmentModalOpen = true
                      }}
                    >
                      <Pencil/>
                    </button>
                    <button
                      on:click={() => {
                        allColumns[columnIndex][processIndex].committedInputs = allColumns[columnIndex][processIndex].committedInputs.filter(it => it.id != id)
                        if (revisionId) {
                          commitmentsToDelete.push(revisionId)
                        }
                        console.log(commitmentsToDelete, revisionId)
                      }}
                    >
                      <Trash />
                    </button>
                    </div>

                    {#if revisionId}
                    <button
                      style="margin-top: -3px;"
                      on:click={() => {
                        commitmentModalProcess = processIndex
                        commitmentModalColumn = columnIndex
                        commitmentModalSide = "committedInputs"
                        selectedCommitmentId = id
                        selectedProcessId = processes[0].id
                        currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                        economicEventModalOpen = true
                      }}
                    >
                      <EconomicEvent/>
                    </button>
                    {/if}

                    </div>
                  </div>
                {/each}
              </div>
              <div>
                <button
                  class="flex justify-center items-center w-full mb-2"

                  on:click={() => {
                    commitmentModalProcess = processIndex
                    commitmentModalColumn = columnIndex
                    commitmentModalSide = "committedOutputs"
                    // console.log(allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide][0].id)
                    commitmentModalOpen = true
                    // console.log(allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide][0].id)
                    selectedCommitmentId = undefined
                  }}
                >
                  <PlusCircle />
                </button>

                {#each committedOutputs as { resourceConformsTo, providerId, resourceQuantity, action, receiverId, id, revisionId, agreement, fulfilledBy, finished, clauseOf }}
                {@const color = finished ? "#c4fbc4" : (((fulfilledBy && fulfilledBy.length > 0) || yellow.includes(id)) ? "#fbfbb0" : "white")}
                <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                    style="background-color: {color};"
                    >
                    <div>
                      <p>{resourceConformsTo?.name}</p>
                      <div class="flex justify-between">
                        <!--
                      <p>
                        {supply_driven_quantity?.hasNumericalValue}
                        {supply_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                        <p>
                          {action.label}

                          {#if fulfilledBy && fulfilledBy.length > 0 && fulfilledBy[0].id}
                            {@const yellowAmount = yellowAmounts[id] || 0}
                            {@const amount = fulfilledBy.map(it => it.fulfilledBy.resourceQuantity.hasNumericalValue).reduce((acc, it) => new Decimal(acc).add(it), new Decimal(0)).toString()}
                            {new Decimal(amount).add(yellowAmount).toString()}
                            {fulfilledBy[0].fulfilledBy.resourceQuantity.hasUnit.label}
                          {:else if yellowAmounts[id]}
                            {yellowAmounts[id]}
                            <!-- {resourceQuantity?.hasUnit?.label} -->
                            {#each units as unit}
                              {#if unit.id == resourceQuantity.hasUnitId}
                                {unit.label}
                              {/if}
                            {/each}
                          {:else}
                            {new Decimal(resourceQuantity?.hasNumericalValue).toString()}
                            <!-- {resourceQuantity?.hasUnit?.label} -->
                            {#each units as unit}
                              {#if unit.id == resourceQuantity.hasUnitId}
                                {unit.label}
                              {/if}
                            {/each}
                          {/if}
                        </p>
                        <!--
                      <p>
                        {demand_driven_quantity?.hasNumericalValue}
                        {demand_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                      </div>
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
                      </p>
                      {#if clauseOf}
                        {@const clause = clauseOf.commitments.find(it => it.action.label == "transfer")}
                        {#if clause}
                          <p>
                            cost {new Decimal(
                              clause.resourceQuantity.hasNumericalValue
                            )
                              .toFixed(2, Decimal.ROUND_HALF_UP)
                              .toString()}
                            {clause.resourceConformsTo.name}
                          </p>
                        {/if}
                      {/if}
                    </div>
                    <!-- {#if editable} -->
                    <div class="w-full flex justify-center">
                      <div style="margin-right: 20px; margin-top: 4px;">
                        <button on:click={() => {
                          let index = allColumns[columnIndex][processIndex].committedOutputs.findIndex(it => it.id == id)
                          if (index > 0) {
                            let temp = allColumns[columnIndex][processIndex].committedOutputs[index]
                            allColumns[columnIndex][processIndex].committedOutputs[index] = allColumns[columnIndex][processIndex].committedOutputs[index - 1]
                            allColumns[columnIndex][processIndex].committedOutputs[index - 1] = temp
                          }
                        }}>
                          <img class="mx-auto" height="14px" width="14px" src="/arrow-up.svg" alt="" />
                        </button>
                        <button on:click={() => {
                          let index = allColumns[columnIndex][processIndex].committedOutputs.findIndex(it => it.id == id)
                          if (index < allColumns[columnIndex][processIndex].committedOutputs.length - 1) {
                            let temp = allColumns[columnIndex][processIndex].committedOutputs[index]
                            allColumns[columnIndex][processIndex].committedOutputs[index] = allColumns[columnIndex][processIndex].committedOutputs[index + 1]
                            allColumns[columnIndex][processIndex].committedOutputs[index + 1] = temp
                          }
                        }}>
                          <img class="mx-auto" height="14px" width="14px" src="/arrow-down.svg" alt="" />
                        </button>
                      </div>

                      <div style="margin-right: 20px; margin-top: 1px">
                      <button
                        on:click={() => {
                          commitmentModalProcess = processIndex
                          commitmentModalColumn = columnIndex
                          commitmentModalSide = "committedOutputs"
                          selectedCommitmentId = id
                          currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                          commitmentModalOpen = true
                        }}
                      >
                      <Pencil/>
                    </button>
                    <button
                    on:click={() => {
                      allColumns[columnIndex][processIndex].committedOutputs = allColumns[columnIndex][processIndex].committedOutputs.filter(it => it.id != id)
                      if (revisionId != undefined) {
                        commitmentsToDelete.push(revisionId)
                      }
                    }}
                      >
                      <Trash />
                    </button>
                    </div>

                    {#if revisionId}
                      <button
                        style="margin-top: -3px;"
                        on:click={() => {
                          commitmentModalProcess = processIndex
                          commitmentModalColumn = columnIndex
                          commitmentModalSide = "committedOutputs"
                          selectedCommitmentId = id
                          selectedProcessId = processes[0].id
                          currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                          economicEventModalOpen = true
                        }}
                      >
                        <EconomicEvent/>
                      </button>
                    {/if}

                    </div>
                    <!-- {/if} -->
                  </div>
                {/each}
              </div>
            </div>
          </div>
          {/each}
      </div>
    {/each}

    <div class="min-w-[250px]">
      <!-- <strong>Total cost: $189</strong> -->
      <h2 class="text-center" style="margin-top: 42px; margin-bottom: 11px;">Total cost: ${totalCost}</h2>
      <!-- <h2 class="text-center text-xl font-semibold">{name}</h2> -->
      <h2 class="text-center text-xl font-semibold">Satisfy Requests</h2>
      <div class="bg-blue-300 border border-gray-400 p-2" style="background-color: #EEEEEE;">
        <!-- Sub-columns -->
        <div class="">
          <div>
            <button
              class="flex justify-center items-center w-full mb-2"
              on:click={() => {
                commitmentModalProcess = undefined
                commitmentModalColumn = undefined
                selectedCommitmentId = undefined
                commitmentModalSide = ""
                commitmentModalOpen = true
              }}
            >
              <PlusCircle />
            </button>
            {#each commitments as c}
              <!-- {JSON.stringify(c)} -->
              {@const resourceConformsTo = c.resourceConformsTo}
              {@const resourceQuantity = c.resourceQuantity}
              <!-- {@const receiver = c.receiver} -->
              {@const id = c.id}
              {@const revisionId = c.revisionId}
              {@const action = c.action}
              <div
                class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
              >
                <div>
                  <p>{resourceConformsTo?.name}</p>
                  <p>
                    {action.label}
                    {resourceQuantity?.hasNumericalValue}
                    <!-- {resourceConformsTo?.defaultUnitOfResource?.label} -->
                    {#each units as unit}
                      {#if unit.id == resourceConformsTo?.defaultUnitOfResourceId}
                        {unit.label}
                      {/if}
                    {/each}
                  </p>
                  <p>to 
                    {#each agents as agent}
                      {#if agent.id == c.receiverId}
                        {agent.name}
                      {/if}
                    {/each}
                  </p>
                </div>
                <div class="w-full flex justify-center">
                  <button
                    on:click={() => {
                      currentProcess = undefined
                      selectedCommitmentId = id
                      commitmentModalOpen = true
                    }}
                  >
                    <Pencil />
                  </button>
                  <button
                    on:click={() => {
                      (commitments = commitments.filter(it => it.id != id));
                      commitmentsToDelete.push(revisionId);
                    }}
                  >
                    <Trash />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <div class="min-w-[200px] mt-20">
      <h2 class="text-center text-xl font-semibold">Requests</h2>
      <div class="bg-blue-300 border border-gray-400 p-2" style="background-color: #8C8C8C;">
        <!-- Sub-columns -->
        <div class="">
          <div>
            {#each proposalsList as { publishes }}
              {@const reciprocal = publishes.find(it => it.reciprocal)}
              {@const primary = publishes.find(it => !it.reciprocal)}
              {#if primary?.publishes?.receiver}
                <div
                  class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                >
                  <p>{primary?.publishes?.resourceConformsTo?.name}</p>
                  <p>
                    {primary?.publishes?.action?.label}
                    {primary?.publishes?.resourceQuantity?.hasNumericalValue}
                    {#each units as unit}
                      {#if unit.id == primary?.publishes?.resourceQuantity?.hasUnitId}
                        {unit.label}
                      {/if}
                    {/each}
                  </p>
                  <p>to 
                    {#each agents as agent}
                      {#if agent.id == primary?.publishes?.receiver.id}
                        {agent.name}
                      {/if}
                    {/each}
                  </p>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>
    </div>

  </div>
  <!-- </div>
  </div> -->
</div>
{/if}

<style>
  /* Custom CSS */
  .custom-background {
    /* background-image: url('/heading3.png'); */
    background-image: url('/dsf.jpg');
    background-size: cover;
    background-position: center;
  }
</style>
