import { gql } from 'graphql-tag'

export const ECONOMIC_RESOURCE_RETURN_FIELDS = gql`
  fragment EconomicResourceReturnFields on EconomicResource {
    id
    name
    note
    conformsTo {
      id
    }
    stageId
    accountingQuantity {
      hasNumericalValue
      hasUnit {
        id
      }
    }
  }   
`