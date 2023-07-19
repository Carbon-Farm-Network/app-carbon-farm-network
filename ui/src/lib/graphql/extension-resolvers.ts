/**
 * Carbon Farm Network app-specific GraphQL extensions
 *
 * Integrates the following Holochain Cells with hREA's Valueflows-based
 * GraphQL API to enable easy querying in UI component logic.
 *
 * @package Carbon Farm Network
 * @since   2023-05-24
 */
import { encodeHashToBase64, decodeHashFromBase64, type CellId, type EntryHash, type EntryHashB64 } from '@holochain/client'
import { mapZomeFn } from '@valueflows/vf-graphql-holochain'
import type { DNAIdMappings } from '@valueflows/vf-graphql-holochain'

import type { Organization, ResourceSpecification } from '@valueflows/vf-graphql'
import type {
  FacetGroupParams, FacetGroup, FacetGroupResponse,
  FacetParams, FacetParamsRaw, Facet, FacetResponse,
  FacetValueParams, FacetValueParamsRaw, FacetValue, FacetValueResponse,
  RawRecordIdentifierMeta,
  AssociateFacetValue,
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
  const runCreateOption = mapZomeFn<FacetParams, Facet>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'create_facet_option')
  const runCreateValue = mapZomeFn<FacetValueParams, FacetValue>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'create_facet_value')
  const runAssociateFacetValue = mapZomeFn<AssociateFacetValue, boolean>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'use_facet_value')

  // :TODO: deletions API

  // zome read API
  // const readFacetGroups = mapZomeFn<Record<string, never>, FacetGroup[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'get_facet_groups')
  const readFacetGroups = mapZomeFn<never, FacetGroup[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'get_facet_groups')
  const readFacets = mapZomeFn<{ facet_group_hash: EntryHashB64 }, Facet[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'get_facet_options_for_facet_group')
  const readFacetValues = mapZomeFn<{ facet_option_hash: EntryHashB64 }, FacetValue[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'get_facet_values_for_facet_option')
  const readFacetValuesWithIdentifierCallback = mapZomeFn<{ identifier: String }, FacetValue[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'retrieve_facet_values')
  const readFacetOfValue = mapZomeFn<{ facet_value_hash: EntryHash }, FacetValue[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'get_facet_option_for_facet_value')
  const readFacetGroupsOfFacet= mapZomeFn<{ facet_option_hash: EntryHash }, FacetValue[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'get_facet_groups_for_facet_option')

  async function readFacetValuesWithIdentifier (record: {id: String}): Promise<FacetValue[]> {
    // :SHONK: workaround special identifier handling in hREA connection lib
    const res = await readFacetValuesWithIdentifierCallback({ identifier: "identifier-" + record.id })
    // @ts-ignore
    return res.map(encodeIdentifiers)
  }

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
      console.log(args.facet)
    
      const res = await runCreateOption(args.facet)

console.log(res)
        //@ts-ignore unsure about how to encode `EntryHash`->`EntryHashB64` conversions in `encodeIdentifiers`
        return res && { facet: encodeIdentifiers<Facet>(res) } as FacetResponse
      },

      putFacetValue: async function (_root: any, args: { facetValue: FacetValueParams }): Promise<FacetValueResponse> {
        console.info('NEW VALUE', args.facetValue)
        const res = await runCreateValue(args.facetValue)
        console.log(res)

        // console.log(encodeIdentifiers<FacetValue>(res))
        //@ts-ignore unsure about how to encode `EntryHash`->`EntryHashB64` conversions in `encodeIdentifiers`
        return res && { facetValue: encodeIdentifiers<FacetValue>(res) } as FacetValueResponse
      },

      associateFacetValue: async function (_root: any, args: AssociateFacetValue): Promise<boolean> {
        args.identifier = "identifier-" + args.identifier
        console.info('NEW ASSOCIATION', args)
        const res = await runAssociateFacetValue(args)
        console.log(res)
        return res
      }
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
        // :TODO: not sure if this kind of reverse filtering is implemented in the API but is needed for a complete impl
        let x = {
          facet_group_hash: record.id,
        }
        const res = await readFacets(x)
        // @ts-ignore
        return res.map(encodeIdentifiers)
      },
    },
    Facet: {
      group: async function (record: Facet): Promise<FacetGroup> {
        // :TODO: not sure if this kind of reverse filtering is implemented in the API but is needed for a complete impl
        const res = await readFacetGroupsOfFacet({ facet_option_hash: record.id })
        // @ts-ignore
        return encodeIdentifiers<FacetGroup>(res.pop() as FacetGroup)
      },
      
      values: async function (record: Facet): Promise<FacetValue[]> {
        const res = await readFacetValues({ facet_option_hash: record.id })
        // @ts-ignore
        return res.map(encodeIdentifiers)
      },
    },
    
    FacetValue: {
      facet: async function (record: FacetValue): Promise<Facet> {
        // :TODO: this kind of reverse filtering is not yet implemented in the API?
        // console.log(record)
        // let decoded = decodeHashFromBase64(record.id)
        // console.log(decoded)
        // debugger
        const res = await readFacetOfValue({ facet_value_hash: record.id })
        // @ts-ignore
        return encodeIdentifiers<FacetGroup>(res as Facet)
      },
    },
    Organization: {
      facets: readFacetValuesWithIdentifier,
    },
    // ResourceSpecification: {
    //   facets: readFacetValuesWithIdentifier,
    // }
    
  }
}

export default bindResolvers
