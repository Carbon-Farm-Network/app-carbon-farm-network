import type {
  ActionHashB64, EntryHashB64,
  EntryHash, ActionHash,
} from '@holochain/client';

// zome API creation payloads

export interface FacetGroupParams {
  name: string;
  note: string;
}

export interface FacetOptionParams {
  facetGroupId: EntryHashB64
  option: string
}

export interface FacetValueParams {
  facetOptionId: EntryHashB64
  value: string // must match a stored `FacetOption.option`
  note: string
}

// zome API record types

interface RecordIdentifierMeta {
  id: EntryHashB64  // EntryHash from `hash_entry`
  revisionId: ActionHashB64 // ActionHash from `create_entry`
}

export interface RawRecordIdentifierMeta {
  id: EntryHash  // EntryHash from `hash_entry`
  revisionId: ActionHash // ActionHash from `create_entry`
}

export type FacetGroup = FacetGroupParams & RecordIdentifierMeta
export type FacetOption = FacetOptionParams & RecordIdentifierMeta
export type FacetValue = FacetValueParams & RecordIdentifierMeta

// mutation API output structs

export interface FacetGroupResponse {
  facetGroup: FacetGroup
}

export interface FacetOptionResponse {
  facetOption: FacetOption
}

export interface FacetValueResponse {
  facetValue: FacetOption
}

// :TODO: The below needs to be updated to marry with above TypeScript declarations
//        and spec in https://github.com/Carbon-Farm-Network/holochain-facets/issues/1

export default [`
input FacetGroupParams {
  group_id: ID!
  note: string
}

type FacetGroup {
  id: ID!
  revisionId: ID!
  name: String!
  note: String
  options: [FacetOption!]!
}

type FacetOption {
  id: ID!
  revisionId: ID!
  group: FacetGroup!
  name: String!
  note: String
  values: [FacetValue!]!
}

type FacetValue {
  id: ID!
  revisionId: ID!
  option: FacetOption!
  value: String!
  note: String
}

input FacetCreateParams {
  # :TODO:
}

type FacetOptionResponse {
  facet: FacetOption
}

type Organization implements Agent {
  facets(): Facet[]
}

type ResourceSpecification {
  facets(): Facet[]
}

type Mutation  {
  "Create a new facet grouping."
  putFacetGroup(facetGroup: FacetGroupParams!): FacetGroupResponse!

  "Create a new facet classification."
  putFacetOption(facet: FacetOptionCreateParams!): FacetOptionResponse!
}
`]
