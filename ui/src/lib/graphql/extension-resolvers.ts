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
  FacetGroupParams, FacetGroup, FacetGroupResponse,
  FacetParams, FacetParamsRaw, Facet, FacetResponse,
  FacetValueParams, FacetValueParamsRaw, FacetValue, FacetValueResponse,
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
  }
}

// :SHONK: Apologies for the ts-ignores but TypeScript is laborious and dumb at API bindings for little safety gains anyway
//
const bindResolvers = async (dnaConfig: ExtendedDnaConfig, conductorUri: string) =>
{
  // zome write API
  const runCreateGroup = mapZomeFn<FacetGroupParams, FacetGroup>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'create_facet_group')
  const runCreateOption = mapZomeFn<FacetParamsRaw, Facet>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'create_facet_option')
  const runCreateValue = mapZomeFn<FacetValueParamsRaw, FacetValue>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'create_facet_value')

  // :TODO: deletions API

  // zome read API
  // const readFacetGroups = mapZomeFn<Record<string, never>, FacetGroup[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'get_facet_groups')
  const readFacetGroups = mapZomeFn<never, FacetGroup[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'get_facet_groups')
  const readFacets = mapZomeFn<{ facet_group_hash: EntryHash }, Facet[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'get_facet_options_for_facet_group')
  const readFacetValues = mapZomeFn<{ facet_option_hash: EntryHash }, FacetValue[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'get_facet_values_for_facet_option')

  // declare and return all resolver callbacks for GraphQL engine
  return {
    Mutation: {
      putFacetGroup: async function (_root: any, args: { facetGroup: FacetGroupParams }): Promise<FacetGroupResponse> {
console.info('NEW GROUP', args.facetGroup)
        const res = await runCreateGroup(args.facetGroup)
console.log(res)
        //@ts-ignore unsure about how to encode `EntryHash`->`EntryHashB64` conversions in `encodeIdentifiers`
        return res && { facetGroup: encodeIdentifiers<FacetGroup>(res) } as FacetGroupResponse
      },

      putFacet: async function (_root: any, args: { facet: FacetParams }): Promise<FacetResponse> {
      console.info('NEW FACET', args.facet)
      console.log({
        name: args.facet.name,
        note: args.facet.note,
        facet_group_id: decodeHashFromBase64(args.facet.facetGroupId),
      })
    
      const res = await runCreateOption({
        name: args.facet.name,
        note: args.facet.note,
        facet_group_id: decodeHashFromBase64(args.facet.facetGroupId),
      })

console.log(res)
        //@ts-ignore unsure about how to encode `EntryHash`->`EntryHashB64` conversions in `encodeIdentifiers`
        return res && { facet: encodeIdentifiers<Facet>(res) } as FacetResponse
      },

      putFacetValue: async function (_root: any, args: { facetValue: FacetValueParams }): Promise<FacetValueResponse> {
        console.info('NEW VALUE', args.facetValue)
        let x = {
          value: args.facetValue.value,
          note: args.facetValue.note,
          facetId: args.facetValue.facetId,
        }
        console.log(x)
        const res = await runCreateValue(x)

        // console.log(encodeIdentifiers<FacetValue>(res))
        //@ts-ignore unsure about how to encode `EntryHash`->`EntryHashB64` conversions in `encodeIdentifiers`
        return res && { facetValue: encodeIdentifiers<FacetValue>(res) } as FacetValueResponse
      },

      // :TODO: delete APIs & resolvers
      // I suspect you can parameterise the API like
      //     deleteFacetValue: async function (_root: any, args: { identifier: string, value: string }): Promise<bool>
      // instead of adding the previously proposed `associationId` field to `FacetValue`.
    },
    Query: {
      facetGroups: async (args: never): Promise<FacetGroup[]> => {
        const res = await readFacetGroups(args)
        // @ts-ignore
        return res.map(encodeIdentifiers)
      },
    },
    FacetGroup: {
      facets: async function (record: FacetGroup): Promise<Facet[]> {
        console.log('FACET GROUP', record)
        // :TODO: not sure if this kind of reverse filtering is implemented in the API but is needed for a complete impl
        let x = {
          facet_group_hash: decodeHashFromBase64(record.id),
        }
        console.log("readFacet params", x)
        const res = await readFacets(x)
        // console.log(res)
        // @ts-ignore
        return res.map(encodeIdentifiers)
      },
    },
    Facet: {
      /*
      group: async function (record: Facet): Promise<FacetGroup> {
        // :TODO: not sure if this kind of reverse filtering is implemented in the API but is needed for a complete impl
        const res = await readFacetGroups({ has_option_hash: decodeHashFromBase64(record.id) })
        // @ts-ignore
        return encodeIdentifiers<FacetGroup>(res.pop() as FacetGroup)
      },
      */
      values: async function (record: Facet): Promise<FacetValue[]> {
        const res = await readFacetValues({ facet_option_hash: decodeHashFromBase64(record.id) })
        console.log(res)
        // @ts-ignore
        return res.map(encodeIdentifiers)
      },
    },
    /*
    FacetValue: {
      facet: async function (record: FacetValue): Promise<Facet> {
        // :TODO: this kind of reverse filtering is not yet implemented in the API?
        const res = await readFacets({ has_value_hash: decodeHashFromBase64(record.id) })
        // @ts-ignore
        return encodeIdentifiers<FacetGroup>(res.pop() as Facet)
      },
    },
    Organization: {
      facets: async function (record: Organization): Promise<FacetValue[]> {
        // const res = await readFacetValues({ identifier: record.id })
        // // @ts-ignore
        // return res.map(encodeIdentifiers)
        return []
      },
    },
    ResourceSpecification: {
      facets: async function (record: ResourceSpecification): Promise<FacetValue[]> {
        const res = await readFacetValues({ identifier: record.id })
        // @ts-ignore
        return res.map(encodeIdentifiers)
      },
    }
    */
  }
}

export default bindResolvers
