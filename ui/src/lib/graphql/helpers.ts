interface RelayEdge<T> {
  node: T
}

export interface RelayConn<T> {
  edges: RelayEdge<T>[]
}

/**
 * Convert a GraphQL Relay connection data structure to a flat array by
 * extracting every `node` from its result `edges`.
 */
export function flattenRelayConnection<T, E>(resp: T & RelayConn<E> | null | undefined): E[] {
  return resp
    ? resp.edges.map(({ node }) => node)
    : []
}
