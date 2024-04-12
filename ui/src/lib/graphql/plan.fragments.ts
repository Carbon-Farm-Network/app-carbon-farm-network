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
        pageInfo
        edges {
          cursor
          node {
            id
          }
        }
      }
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
          hasUnit {
            id
            label
          }
        }
        resourceConformsTo {
          id
          name
          defaultUnitOfResourceId
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