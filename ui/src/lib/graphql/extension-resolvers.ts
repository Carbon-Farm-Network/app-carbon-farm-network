/**
 * Carbon Farm Network app-specific GraphQL extensions
 *
 * Integrates the following Holochain Cells with hREA's Valueflows-based
 * GraphQL API to enable easy querying in UI component logic.
 *
 * @package Carbon Farm Network
 * @since   2023-05-24
 */
import { encodeHashToBase64, decodeHashFromBase64, type CellId, type EntryHash } from '@holochain/client'
import { mapZomeFn } from '@valueflows/vf-graphql-holochain'
import type { DNAIdMappings } from '@valueflows/vf-graphql-holochain'

import type { Organization, ResourceSpecification } from '@valueflows/vf-graphql'
import type {
  FacetGroup, Facet, FacetValue,
  FacetGroupParams, FacetParams, FacetValueParams,
  FacetGroupResponse, FacetResponse, FacetValueResponse,
  RawRecordIdentifierMeta,
} from './extension-schemas'

// key names here are auto-matched by Cell role name convention in `happ.yaml`
export type ExtendedDnaConfig = DNAIdMappings & {
  facets: CellId
}

export interface ByIdentifier {
  identifier: string
}

export interface ByEntryHash {
  hash: EntryHash
}

function encodeIdentifiers<T>(data: RawRecordIdentifierMeta & T): T {
  return {
    ...data,
    id: encodeHashToBase64(data.id),
    revisionId: encodeHashToBase64(data.revisionId),
  }
}

// :SHONK: Apologies for the ts-ignores but TypeScript is laborious and dumb at API bindings for little safety gains anyway
//
const bindResolvers = async (dnaConfig: ExtendedDnaConfig, conductorUri: string) =>
{
  // zome write API
  const runCreateGroup = mapZomeFn<FacetGroupParams, FacetGroupResponse>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'create_facet_group')
  const runCreateOption = mapZomeFn<FacetParams, FacetResponse>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'create_facet_option')
  const runCreateValue = mapZomeFn<FacetValueParams, FacetValueResponse>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'create_facet_value')

  // :TODO: deletions API

  // zome read API
  const readFacetGroups = mapZomeFn<Record<string, never>, FacetGroup[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'retrieve_facet_groups')
  const readFacets = mapZomeFn<ByEntryHash, Facet[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'get_facet_options_for_facet_group')
  const readFacetValues = mapZomeFn<ByEntryHash | ByIdentifier, FacetValue[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'retrieve_facet_values')

  // declare and return all resolver callbacks for GraphQL engine
  return {
    Mutation: {
      putFacetGroup: async function (_root: any, args: FacetGroupParams): Promise<FacetGroupResponse> {
        const res = await runCreateGroup(args)
        // @ts-ignore
        res.facetGroup = encodeIdentifiers<FacetGroup>(res.facetGroup)
        return res
      },
      putFacet: async function (_root: any, args: FacetParams): Promise<FacetResponse> {
        const res = await runCreateOption({
          ...args,
          facetGroupId: decodeHashFromBase64(args.facetGroupId),
        })
        res.facetOption = {
          // @ts-ignore
          ...encodeIdentifiers<Facet>(res.facetOption),
          // @ts-ignore
          facetGroupId: encodeHashToBase64(res.facetOption.facetGroupId),
        }
        return res
      },
      putFacetValue: async function (_root: any, args: FacetValueParams): Promise<FacetValueResponse> {
        const res = await runCreateValue({
          ...args,
          facetOptionId: decodeHashFromBase64(args.facetOptionId),
        })
        res.facetValue = {
          // @ts-ignore
          ...encodeIdentifiers<FacetValue>(res.facetValue),
          // @ts-ignore
          facetOptionId: encodeHashToBase64(res.facetValue.facetOptionId),
        }
        return res
      },
      // :TODO: delete APIs & resolvers
      // I suspect you can parameterise the API like
      //     deleteFacetValue: async function (_root: any, args: { identifier: string, value: string }): Promise<bool>
      // instead of adding the previously proposed `associationId` field to `FacetValue`.
    },
    Query: {
      facetGroups: async (_root: unknown, args: Record<string, never>): Promise<FacetGroup[]> => {
        const res = await readFacetGroups(args)
        // :TODO: presuming you are returning from the zome API as a flat array here, but adjust accordingly
        // @ts-ignore
        return res.map(encodeIdentifiers)
      },
    },
    FacetGroup: {
      facets: async function (record: FacetGroup): Promise<Facet[]> {
        // :TODO: not sure if this kind of reverse filtering is implemented in the API but is needed for a complete impl
        const res = await readFacets({ group_hash: decodeHashFromBase64(record.id) })
        // @ts-ignore
        return res.map(encodeIdentifiers)
      },
    },
    Facet: {
      group: async function (record: Facet): Promise<FacetGroup> {
        // :TODO: not sure if this kind of reverse filtering is implemented in the API but is needed for a complete impl
        const res = await readFacetGroups({ has_option_hash: decodeHashFromBase64(record.id) })
        // @ts-ignore
        return encodeIdentifiers<FacetGroup>(res.pop() as FacetGroup)
      },
      values: async function (record: Facet): Promise<FacetValue[]> {
        const res = await readFacetValues({ option_hash: decodeHashFromBase64(record.id) })
        // @ts-ignore
        return res.map(encodeIdentifiers)
      },
    },
    FacetValue: {
      facet: async function (record: FacetValue): Promise<Facet> {
        // :TODO: not sure if this kind of reverse filtering is implemented in the API but is needed for a complete impl
        const res = await readFacets({ has_value_hash: decodeHashFromBase64(record.id) })
        // @ts-ignore
        return encodeIdentifiers<FacetGroup>(res.pop() as Facet)
      },
    },
    Organization: {
      facets: async function (record: Organization): Promise<FacetValue[]> {
        const res = await readFacetValues({ identifier: record.id })
        // @ts-ignore
        return res.map(encodeIdentifiers)
      },
    },
    ResourceSpecification: {
      facets: async function (record: ResourceSpecification): Promise<FacetValue[]> {
        const res = await readFacetValues({ identifier: record.id })
        // @ts-ignore
        return res.map(encodeIdentifiers)
      },
    }
  }
}

export default bindResolvers
