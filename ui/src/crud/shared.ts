import { decode, encode } from '@msgpack/msgpack';
import { decodeHashFromBase64, encodeHashToBase64, type ActionHash } from '@holochain/client'
import { allResourceSpecifications, allProcessSpecifications, allActions, allUnits, allEconomicResources, allAgents, allAgreements, plansList, clientStored, clientHC, allFulfillments, allEconomicEvents } from './store';
import { get } from 'svelte/store';

let client: any;
clientStored.subscribe(value => {
  client = value;
});

let client0: any;
clientHC.subscribe(value => {
  client0 = value;
});

const hashFields = [
  { field: 'processConformsTo', stored: allProcessSpecifications },
  { field: 'basedOn', stored: allProcessSpecifications },
  { field: 'stage', stored: allProcessSpecifications },
  { field: 'recipeClauseOf', stored: allProcessSpecifications },
  { field: 'resourceConformsTo', stored: allResourceSpecifications },
  { field: 'conformsTo', stored: allResourceSpecifications },
  { field: 'resourceInventoriedAs', stored: allEconomicResources },
  { field: 'resource', stored: allEconomicResources },
  // { field: 'fulfilledBy', stored: allEconomicEvents },
  { field: 'action', stored: allActions },
  { field: 'hasUnit', stored: allUnits },
  { field: 'defaultUnitOfResource', stored: allUnits },
  { field: 'provider', stored: allAgents },
  { field: 'receiver', stored: allAgents },
  { field: 'primaryAccountable', stored: allAgents },
  { field: 'clauseOf', stored: allAgreements },
  { field: 'plannedWithin', stored: plansList },
  { field: 'inputOf', stored: null },
  { field: 'outputOf', stored: null },
  { field: 'id', stored: null },
  { field: 'revisionId', stored: null }
]

export function formatResItem(resItem: any, id: ActionHash | null = null) {
  if (!resItem?.entry?.Present?.entry) { return null }
  // console.log("raw item to format for frontend: ", resItem)
  let decoded = decode(resItem.entry.Present.entry)
  // console.log("decoded item for frontend: ", decoded)
  let camel = snakeToCamel(decoded)
  // console.log("camel-cased for frontend: ", camel)
  let revisionId = resItem.signed_action.hashed.hash
  let withId = { 
    ...camel, 
    id: id,
    revisionId: revisionId || id
  }
  // if (withId.action) {
  //   withId.actionId = withId.action
  //   withId.action = 
  // }
  let encoded = encodeHashFields(withId)
  // console.log("turned hashes to strings for frontend: ", encoded)
  encoded = findAndEncodeQuantityValueFields(encoded)
  encoded = formatDates(encoded)
  // console.log("formatted quantity fields for frontend: ", encoded)
  return encoded
}

export function snakeToCamel(lib: any) {
  // make every key camelCase if it is snake_case
  let camel: any = {}
  for (let key in lib) {
    let camelKey = key.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); })
    // convert rea_action
    if (camelKey === "reaAction") {
      camelKey = "action"
    }
    camel[camelKey] = lib[key]
  }
  return camel
}

export function camelToSnake(lib: any) {
  // make every key snake_case if it is camelCase
  let snake: any = {}
  for (let key in lib) {
    let snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase()
    // convert action
    if (snakeKey === "action") {
      snakeKey = "rea_action"
    }
    // turn null values into undefined
    let value = lib[key] === null ? undefined : lib[key]
    // if the value is an object, recursively convert its keys
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      value = camelToSnake(value)
    }
    snake[snakeKey] = value
  }
  return snake
}

export function detectQuantityValueField(field: any) {
  if (field.has_numerical_value !== undefined && field.has_unit !== undefined) {
    return true
  }
  return false
}

export function encodePotentialQuantityValueField(field: any) {
  if ( detectQuantityValueField(field) ) {
    const encodedUnitId = field.has_unit ? encodeHashToBase64(field.has_unit) : null
    return {
      hasNumericalValue: field.has_numerical_value,
      hasUnit: get(allUnits).find((unit: any) => unit.id == encodedUnitId),
      hasUnitId: encodedUnitId
    }
  } else {
    return field
  }
}

export function findAndEncodeQuantityValueFields(obj: any) {
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (detectQuantityValueField(obj[key])) {
        obj[key] = encodePotentialQuantityValueField(obj[key])
      }
    }
  }
  return obj
}

export function decodePotentialQuantityValueField(field: any) {
  console.log("decoding potential quantity value field: ", field)
  if (field.hasNumericalValue !== undefined && field.hasUnit !== undefined) {
    return {
      has_numerical_value: field.hasNumericalValue,
      has_unit: field.hasUnit?.id ? field.hasUnit.id : (field.hasUnit ? field.hasUnit : null)
    }
  }
  return field
}

export function findAndDecodeQuantityValueFields(obj: any) {
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (obj[key].hasNumericalValue !== undefined && obj[key].hasUnit !== undefined) {
        obj[key] = decodePotentialQuantityValueField(obj[key])
      }
    }
  }
  return obj
}

const dateFields = ['due', 'hasBeginning', 'hasEnd']
export function formatDates(obj: any) {
  dateFields.forEach(field => {
    if (obj[field]) {
      obj[field] = new Date(obj[field])
    }
  })
  return obj
}

export function encodeHashFields(obj: any) {
  hashFields.forEach(field => {
    if (obj[field.field]) {
      // console.log("attempting to format a hash: ", field, obj[field.field])
      const encodedField = field.field == 'action' ? obj[field.field] : encodeHashToBase64(obj[field.field])
      // console.log("formatted hash: ", encodedField)

      // get the stored value
      if (field.stored) {
        const storedValues = get(field.stored)
        // console.log("stored values: ", storedValues, encodedField)
        let relevantValue = storedValues?.find((item: any) => item.id === encodedField)
        obj[field.field] = relevantValue ? relevantValue : { id: encodedField }
        obj[`${field.field}Id`] = encodedField
      } else {
        obj[field.field] = encodedField
      }
    } else {
      obj[`${field.field}Id`] = null
      obj[`${field.field}`] = null
    }
  })
  return obj
}

export function decodeHashFields(obj: any, hashFields: string[]) {
  hashFields.forEach(field => {
    if (obj[field]) {
      const decodedField = decodeHashFromBase64(obj[field])
      obj[field] = decodedField
      obj[`${field}Id`] = decodedField
    }
  })
  return obj
}

export async function pull(func: string, args: any, customRole?: string, customZome?: string) {
  // let weClient = await WeaveClient.connect(appletServices);
  // let res = await weClient.renderInfo.appletClient.callZome({
  let res = await client0.callZome({
    cap_secret: null,
    role_name: customRole || 'hrea',
    zome_name: customZome || 'hrea',
    fn_name: func,
    payload: args,
  })
  return res
}

export async function realizeLinks(func: string, links: any[]) {
  let items = []
  for (let i = 0; i < links.length; i++) {
    const res = await pull(func, links[i].target)
    if (res) {
      let formattedItem = formatResItem( res, links[i].target )
      formattedItem.updated_at = res.signed_action.hashed.content.timestamp
      items.push( formattedItem )
    } else {
      console.log(`No entry for item (${func})`, links[i].target)
    }
  }
  // sort by timestamp
  items.sort((a, b) => { return b.updated_at - a.updated_at })
  return items
}

export async function fetchSet(entry_type: string, entry_type_pluralized: string) {
  console.log("fetching set of", entry_type, entry_type_pluralized)
  const links = (await pull(`get_all_${entry_type_pluralized}`, null))
  console.log("links to fetch", links)
  const realized = await realizeLinks(`get_latest_${entry_type}`, links)
  console.log("realized", realized)
  return realized
}