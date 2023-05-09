import { gql } from 'graphql-tag'

export const AGENT_CORE_FIELDS = gql`
  fragment AgentCoreFields on Agent {
    id
    revisionId
    name
    image
    note
  }
`
export const PERSON_CORE_FIELDS = gql`
  fragment PersonCoreFields on Person {
    id
    revisionId
    name
    image
    note
  }
`
export const ORGANIZATION_CORE_FIELDS = gql`
  fragment OrganizationCoreFields on Organization {
    id
    revisionId
    name
    image
    note
  }
`
