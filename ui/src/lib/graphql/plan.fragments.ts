import { gql } from 'graphql-tag'

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
        clauseOf {
          commitments {
            id
            resourceQuantity {
              hasNumericalValue
              hasUnit {
                label
              }
            }
          }
        }
      }
      committedOutputs {
        id
        revisionId
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
        clauseOf {
          commitments {
            id
            resourceQuantity {
              hasNumericalValue
              hasUnit {
                label
              }
            }
          }
        }
      }
    }
  }
`