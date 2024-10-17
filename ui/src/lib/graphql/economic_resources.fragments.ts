import { gql } from 'graphql-tag'

export const ECONOMIC_RESOURCE_RETURN_FIELDS = gql`
  fragment EconomicResourceReturnFields on EconomicResource {
    id
    revisionId
    name
    note
    conformsTo {
      id
    }
    stageId
    trackingIdentifier
    accountingQuantity {
      hasNumericalValue
      hasUnitId
    }
  }   
`