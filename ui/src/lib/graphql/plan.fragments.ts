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
    independentDemands {
      id
      revisionId
      action {
        id
        label
      }
      receiverId
      resourceQuantity {
        hasNumericalValue
        hasUnitId
      }
      resourceConformsTo {
        id
        name
        defaultUnitOfResourceId
      }
    }
    processes {
      id
      revisionId
      name
      meta {
        retrievedRevision {
          id
          time
        }
      }
      basedOn {
        id
        name
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
      label
    }
    meta {
      retrievedRevision {
        id
        time
      }
    }
    providerId
    provider {
      id
      name
    }
    receiverId
    resourceQuantity {
      hasNumericalValue
      hasUnitId
    }
    resourceConformsTo {
      id
      name
      defaultUnitOfResourceId
    }
    fulfilledBy {
      fulfilledBy {
        id
        action {
          id
          label
        }
        providerId
        provider {
          id
          name
        }
        receiverId
        resourceConformsTo {
          id
          name
          defaultUnitOfResourceId
        }
        resourceQuantity {
          hasNumericalValue
          hasUnitId
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
        fulfilledBy {
          id
        }
        action {
          id
          label
        }
        resourceConformsTo {
          id
          name
          defaultUnitOfResourceId
        }
        resourceQuantity {
          hasNumericalValue
          hasUnitId
        }
      }
    }
  }
`

export const PROCESS_RETURN_FIELDS = gql`
  fragment ProcessReturnFields on Process {
    id
    revisionId
    name
    plannedWithin {
      id 
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
    }
    committedInputs {
      id
      revisionId
      hasBeginning
      action {
        id
        label
      }
      meta {
        retrievedRevision {
          id
          time
        }
      }
      providerId
      provider {
        id
        name
      }
      receiverId
      resourceQuantity {
        hasNumericalValue
        hasUnitId
      }
      resourceConformsTo {
        id
        name
        defaultUnitOfResourceId
      }
      fulfilledBy {
        id
      }
      clauseOf {
        id
        name
        note
        revisionId
        commitments {
          id
          revisionId
          providerId
          finished
          fulfilledBy {
            id
          }
          receiverId
          hasBeginning
          action {
            id
            label
          }
          resourceConformsTo {
            id
            name
            defaultUnitOfResourceId
          }
          resourceQuantity {
            hasNumericalValue
            hasUnitId
          }
        }
      }
      finished
    }
    committedOutputs {
      id
      revisionId
      hasBeginning
      action {
        id
        label
      }
      meta {
        retrievedRevision {
          id
          time
        }
      }
      providerId
      provider {
        id
        name
      }
      receiverId
      resourceQuantity {
        hasNumericalValue
        hasUnitId
      }
      resourceConformsTo {
        id
        name
        defaultUnitOfResourceId
      }
      fulfilledBy {
        id
      }
      clauseOf {
        id
        name
        note
        revisionId
        commitments {
          finished
          fulfilledBy {
            id
          }
          id
          revisionId
          providerId
          receiverId
          hasBeginning
          action {
            id
            label
          }
          resourceConformsTo {
            id
            name
            defaultUnitOfResourceId
          }
          resourceQuantity {
            hasNumericalValue
            hasUnitId
          }
        }
      }
      finished
    }
  }
`

export const PLAN_RETURN_FIELDS = gql`
  fragment PlanReturnFields on Plan {
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
    independentDemands {
      id
      revisionId
      action {
        id
        label
      }
      receiverId
      resourceQuantity {
        hasNumericalValue
        hasUnitId
      }
      resourceConformsTo {
        id
        name
        defaultUnitOfResourceId
      }
    }
    nonProcessCommitments {
      id
      revisionId
      stageId
      action {
        id
        label
      }
      finished
      fulfilledBy {
        id
      }
      receiverId
      providerId
      resourceQuantity {
        hasNumericalValue
        hasUnitId
      }
      resourceConformsTo {
        id
        name
        defaultUnitOfResourceId
      }
      clauseOf {
        id
        name
        note
        revisionId
        commitments {
          finished
          fulfilledBy {
            id
          }
          id
          revisionId
          providerId
          receiverId
          hasBeginning
          action {
            id
            label
          }
          resourceConformsTo {
            id
            name
            defaultUnitOfResourceId
            resourceClassifiedAs
          }
          resourceQuantity {
            hasNumericalValue
            hasUnitId
          }
        }
      }
    }
    processes {
      id
      revisionId
      name
      meta {
        retrievedRevision {
          id
          time
        }
      }
      basedOn {
        id
        name
      }
      committedInputs {
        id
        revisionId
        hasBeginning
        action {
          id
          label
        }
        meta {
          retrievedRevision {
            id
            time
          }
        }
        providerId
        provider {
          id
          name
        }
        receiverId
        resourceQuantity {
          hasNumericalValue
          hasUnitId
        }
        resourceConformsTo {
          id
          name
          defaultUnitOfResourceId
          resourceClassifiedAs
        }
        finished
        fulfilledBy {
          id
        }
        clauseOf {
          id
          name
          note
          revisionId
          commitments {
            finished
            fulfilledBy {
              id
            }
            id
            revisionId
            providerId
            receiverId
            hasBeginning
            action {
              id
              label
            }
            resourceConformsTo {
              id
              name
              defaultUnitOfResourceId
              resourceClassifiedAs
            }
            resourceQuantity {
              hasNumericalValue
              hasUnitId
            }
          }
        }
      }
      committedOutputs {
        id
        revisionId
        hasBeginning
        action {
          id
          label
        }
        meta {
          retrievedRevision {
            id
            time
          }
        }
        providerId
        provider {
          id
          name
        }
        receiverId
        resourceQuantity {
          hasNumericalValue
          hasUnitId
        }
        resourceConformsTo {
          id
          name
          resourceClassifiedAs
        }
        finished
        fulfilledBy {
          id
        }
        clauseOf {
          id
          name
          note
          revisionId
          commitments {
            id
            revisionId
            providerId
            receiverId
            hasBeginning
            finished
            fulfilledBy {
              id
            }
            action {
              id
              label
            }
            resourceConformsTo {
              id
              name
              defaultUnitOfResourceId
            }
            resourceQuantity {
              hasNumericalValue
              hasUnitId
            }
          }
        }
      }
    }
  }
`