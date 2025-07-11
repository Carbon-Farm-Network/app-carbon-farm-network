import { gql } from 'graphql-tag'

export const SIMPLIFIED_PLAN_RETURN_FIELDS = gql`
  fragment SimplifiedPlanReturnFields on Plan {
    id
    revisionId
    name
    note
    meta {
      retrievedRevision {
        id
        time
      }
    }
  }
`

export const COMMITMENT_RETURN_FIELDS = gql`
  fragment CommitmentReturnFields on Commitment {
    id
    revisionId
    hasBeginning
    action {
      id
      symbol
      label
    }
    meta {
      retrievedRevision {
        id
        time
      }
    }
    provider {
      id
      name
    }
    receiver {
      id
      name
    }
    inputOf {
      id
      revisionId
    }
    outputOf {
      id
      revisionId
    }
    resourceQuantity {
      hasNumericalValue
      hasUnit {
        id
        label
        symbol
      }
    }
    resourceConformsTo {
      id
      name
      defaultUnitOfResource {
        id
      }
    }
    stage {
      id
      name
    }
    fulfilledBy {
      fulfilledBy {
        id
        action {
          id
          symbol
          label
        }
        provider {
          id
          name
        }
        resourceConformsTo {
          id
          name
          defaultUnitOfResource {
            id
          }
        }
        resourceQuantity {
          hasNumericalValue
          hasUnit {
            id
            label
            symbol
          }
        }
        hasBeginning
      }
    }
    finished
    clauseOf {
      id
      name
      note
      revisionId
      commitments {
        id
        revisionId
        finished
        provider {
          id
          name
        }
        receiver {
          id
          name
        }
        fulfilledBy {
          id
        }
        action {
          id
          symbol
          label
        }
        resourceConformsTo {
          id
          name
          defaultUnitOfResource {
            id
          }
        }
        resourceQuantity {
          hasNumericalValue
          hasUnit {
            id
            label
            symbol
          }
        }
      }
    }
  }
`

export const NON_PROCESS_COMMITMENT_RETURN_FIELDS = gql`
  fragment nonProcessCommitments on Plan {
    nonProcessCommitments {
      id
      revisionId
      stage {
        id
      }
      action {
        id
        symbol
        label
      }
      finished
      fulfilledBy {
        id
      }
      provider {
        id
      }
      receiver {
        id
      }
      resourceQuantity {
        hasNumericalValue
        hasUnit {
          id
          label
          symbol
        }
      }
      resourceConformsTo {
        id
        name
        defaultUnitOfResource {
          id
        }
      }
      clauseOf {
        id
        name
        note
        revisionId
        commitments(revisionId: String) {
          ...CommitmentReturnFields
        }
      }
    }
  }
`

export const PROCESS_RETURN_FIELDS = gql`
  ${COMMITMENT_RETURN_FIELDS}
  fragment ProcessReturnFields on Process {
    id
    revisionId
    name
    plannedWithin {
      id 
      name
    }
    meta {
      retrievedRevision {
        id
        time
      }
    }
    basedOn {
      id
      name
      image
    }
    committedInputs (revisionId: String) {
      ...CommitmentReturnFields
    }
    committedOutputs(revisionId: String) {
      ...CommitmentReturnFields
    }
  }
`

export const PLAN_RETURN_FIELDS = gql`
  ${PROCESS_RETURN_FIELDS}
  ${COMMITMENT_RETURN_FIELDS}
  ${SIMPLIFIED_PLAN_RETURN_FIELDS}
  ${NON_PROCESS_COMMITMENT_RETURN_FIELDS}
  fragment PlanReturnFields on Plan {
    ...SimplifiedPlanReturnFields
    independentDemands(revisionId: String) {
      ...CommitmentReturnFields
    }
    nonProcessCommitments(revisionId: String) {
      ...CommitmentReturnFields
    }
    processes(revisionId: String) {
      ...ProcessReturnFields
    }
  }
`
