import type {
  ActionHashB64, EntryHashB64,
  EntryHash, ActionHash,
} from '@holochain/client';
import type { Agent, Proposal } from '@valueflows/vf-graphql'

// zome API creation payloads

export interface FacetGroupParams {
  name: string;
  note: string;
}

interface FacetParamsBase {
  name: string
  note: string
}
export type FacetParams = FacetParamsBase & { facetGroupId: EntryHashB64 }
export type FacetParamsRaw = FacetParamsBase & { facetGroupId: EntryHash }

export interface FacetValueParamsBase {
  value: string // must match a stored `Facet.option`
  note: string
}
export type FacetValueParams = FacetValueParamsBase & { facetId: EntryHashB64 }
export type FacetValueParamsRaw = FacetValueParamsBase & { facetId: EntryHash }

export interface AssociateFacetValue { identifier: string, facetValueId: EntryHashB64 }
export type DeassociateFacetValue = AssociateFacetValue

// zome API record types

interface RecordIdentifierMeta {
  id: EntryHashB64  // EntryHash from `hash_entry`
  revisionId: ActionHashB64 // ActionHash from `create_entry`
}

export interface RawRecordIdentifierMeta {
  id: EntryHash  // EntryHash from `hash_entry`
  revisionId: ActionHash // ActionHash from `create_entry`
}

export type FacetGroup = FacetGroupParams & RecordIdentifierMeta & { facets?: Facet[] }
export type Facet = FacetParams & RecordIdentifierMeta & { facetGroupId: EntryHashB64; values?: FacetValue[], group?: FacetGroup }
export type FacetValue = FacetValueParams & RecordIdentifierMeta & { facetId: EntryHashB64; facet?: Facet }

// mutation API output structs

export interface FacetGroupResponse {
  facetGroup: FacetGroup
}

export interface FacetResponse {
  facet: Facet
}

export interface FacetValueResponse {
  facetValue: FacetValue
}

// extended types

interface LatLon {
  lat: string
  lon: string
}

export type AgentExtended = Agent & {
  facets: FacetValue[]
  offers?: Proposal[]
  latLng?: LatLon
  imageUrl?: string
  iconUrl?: string  // :TODO: duplicate of imageUrl?
  address?: string
  role?: string
}

export default [
// Facet groupings (record type associations)
`
input FacetGroupParams {
  name: String!
  note: String
}

type FacetGroup {
  id: ID!
  revisionId: ID!
  name: String!
  note: String
  facets: [Facet!]!
}

type FacetGroupResponse {
  facetGroup: FacetGroup!
}

`,// Facets (available facets for each record type)
`

input FacetParams {
  facetGroupId: ID!
  name: String!
  note: String
}

type Facet {
  id: ID!
  revisionId: ID!
  group: FacetGroup!
  name: String!
  note: String
  values: [FacetValue!]!
}

type FacetResponse {
  facet: Facet!
}

`,// Facet values (allowed values per Facet)
`

input FacetValueParams {
  facetId: ID!
  value: String!
  note: String
}

type FacetValue {
  id: ID!
  revisionId: ID!
  facet: Facet!
  value: String!
  note: String
}

type FacetValueResponse {
  facetValue: FacetValue!
}

`,// Query API
`

type Organization implements Agent {
  facets: [FacetValue!]!
}

type ResourceSpecification {
  facets: [FacetValue!]!
}

type Query {
  facetGroups: [FacetGroup!]!
  facetValues: [FacetValue!]!
}

`,// Mutation API
`

type Mutation  {
  "Create a new facet grouping to define available facets per record type."
  putFacetGroup(facetGroup: FacetGroupParams!): FacetGroupResponse!

  "Delete a facet grouping via its revisionId."
  deleteFacetGroup(revisionId: ID!): Boolean!

  "Create a new facet available to a record type."
  putFacet(facet: FacetParams!): FacetResponse!

  "Delete a facet via its revisionId"
  deleteFacet(revisionId: ID!): Boolean!

  "Create a new facet value to define possible values for a facet."
  putFacetValue(facetValue: FacetValueParams!): FacetValueResponse!

  "Delete a facet value via its revisionId"
  deleteFacetValue(revisionId: ID!): Boolean!

  "Associate a facet value with an externally located record via its identifier."
  associateFacetValue(identifier: ID!, facetValueId: ID!): Boolean!

  "Remove an associated facet value from a record."
  deassociateFacetValue(identifier: ID!, facetValueId: ID!): Boolean!
}
`]
