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
        id
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