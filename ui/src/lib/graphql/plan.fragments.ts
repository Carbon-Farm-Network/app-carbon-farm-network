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
      receiver {
        id
        name
      }
      resourceQuantity {
        hasNumericalValue
        hasUnit {
          id
          label
        }
      }
      resourceConformsTo {
        id
        name
        defaultUnitOfResource {
          label
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
    provider {
      id
      name
    }
    receiver {
      id
      name
    }
    resourceQuantity {
      hasNumericalValue
      hasUnit {
        id
        label
      }
    }
    resourceConformsTo {
      id
      name
      defaultUnitOfResource {
        label
      }
    }
    fulfilledBy {
      fulfilledBy {
        id
        action {
          id
          label
        }
        provider {
          id
          name
        }
        receiver {
          id
          name
        }
        resourceConformsTo {
          id
          name
          defaultUnitOfResource {
            label
          }
        }
        resourceQuantity {
          hasNumericalValue
          hasUnit {
            id
            label
          }
        }
        hasBeginning
      }
    }
    finished
    clauseOf {
      id
      revisionId
      commitments {
        id
        revisionId
        action {
          id
          label
        }
        resourceConformsTo {
          id
          name
          defaultUnitOfResource {
            label
          }
        }
        resourceQuantity {
          hasNumericalValue
          hasUnit {
            label
          }
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
      provider {
        id
        name
      }
      receiver {
        id
        name
      }
      resourceQuantity {
        hasNumericalValue
        hasUnit {
          id
          label
        }
      }
      resourceConformsTo {
        id
        name
        defaultUnitOfResource {
          label
        }
      }
      fulfilledBy {
        fulfilledBy {
          id
          action {
            id
            label
          }
          provider {
            id
            name
          }
          receiver {
            id
            name
          }
          resourceConformsTo {
            id
            name
            defaultUnitOfResource {
              label
            }
          }
          resourceQuantity {
            hasNumericalValue
            hasUnit {
              id
              label
            }
          }
          hasBeginning
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
      provider {
        id
        name
      }
      receiver {
        id
        name
      }
      resourceQuantity {
        hasNumericalValue
        hasUnit {
          id
          label
        }
      }
      resourceConformsTo {
        id
        name
        defaultUnitOfResource {
          label
        }
      }
      fulfilledBy {
        fulfilledBy {
          id
          action {
            id
            label
          }
          provider {
            id
            name
          }
          receiver {
            id
            name
          }
          resourceConformsTo {
            id
            name
            defaultUnitOfResource {
              label
            }
          }
          resourceQuantity {
            hasNumericalValue
            hasUnit {
              id
              label
            }
          }
          hasBeginning
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
      receiver {
        id
        name
      }
      resourceQuantity {
        hasNumericalValue
        hasUnit {
          id
          label
        }
      }
      resourceConformsTo {
        id
        name
        defaultUnitOfResource {
          label
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
        provider {
          id
          name
        }
        receiver {
          id
          name
        }
        resourceQuantity {
          hasNumericalValue
          hasUnit {
            id
            label
          }
        }
        resourceConformsTo {
          id
          name
          defaultUnitOfResource {
            label
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
        provider {
          id
          name
        }
        receiver {
          id
          name
        }
        resourceQuantity {
          hasNumericalValue
          hasUnit {
            id
            label
          }
        }
        resourceConformsTo {
          id
          name
        }
      }
    }
  }
`