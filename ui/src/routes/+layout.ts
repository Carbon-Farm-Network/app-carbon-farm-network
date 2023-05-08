import { browser } from '$app/environment'
import { error } from '@sveltejs/kit'
import autoConnect from '@vf-ui/graphql-client-holochain'
// import autoConnect from '@vf-ui/graphql-client-mock' // enable to use in-memory mock API

export async function load() {
  if (!browser) return
  try {
    return {
      client: await autoConnect(),
    }
  } catch (e) {
    console.error("Holochain connection error", e)
    throw error(500, "Holochain connection error")
  }
}
