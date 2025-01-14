import { browser } from '$app/environment'
import { error } from '@sveltejs/kit'
// import autoConnect from '@vf-ui/graphql-client-mock' // enable to use in-memory mock API
import autoConnect from '@leosprograms/graphql-client-holochain'
import { openConnection, sniffHolochainAppCells } from '@leosprograms/vf-graphql-holochain'
import { AppWebsocket, AdminWebsocket } from '@holochain/client'
import extensionSchemas from '$lib/graphql/extension-schemas'
import bindResolvers from '$lib/graphql/extension-resolvers'
import type { ExtendedDnaConfig } from '$lib/graphql/extension-resolvers'
import type { AppSignalCb, CellId } from '@holochain/client'
import { appletServices } from '../../we';
import { onMount } from 'svelte';
import { WeaveClient, isWeContext, initializeHotReload, type WAL} from '@lightningrodlabs/we-applet';
import { ApolloClient } from "@apollo/client/core";
import { setClient } from "../crud/store"

const appId = 'acfn'
const ENV_CONNECTION_URI = process.env.REACT_APP_HC_CONN_URL as string || ''
const adminPort = import.meta.env.VITE_ADMIN_PORT
const appPort = import.meta.env.VITE_APP_PORT
const url = `ws://localhost:${appPort}`;
let weClient: WeaveClient
let client: AppWebsocket
let createView
let connected = false

enum RenderType {
  App,
  WAL,
  CreateSpreadsheet,
  BlockActiveBoards
}

let renderType = RenderType.App
let wal: WAL

// export async function loadNormal() {
export async function load() {
  if (!browser) return
  console.log(import.meta.env)
  let profilesClient
  if ((import.meta as any).env.DEV) {
    try {
      await initializeHotReload();
    } catch (e) {
      console.warn("Could not initialize applet hot-reloading. This is only expected to work in a We context in dev mode.")
    }
  }
  try {
    if (isWeContext()) {
      weClient = await WeaveClient.connect(appletServices);
      const weAppId = weClient.renderInfo.appletClient.installedAppId
      console.log("weClient", {...weClient.renderInfo.appletClient, callZome: weClient.renderInfo.appletClient.callZome})
      const weAppWebsocketUrl = weClient.renderInfo.appletClient.client.url
      console.log("weAppWebsocketUrl", weAppWebsocketUrl)
      const mockConn = {
        ...weClient.renderInfo.appletClient.client,
        appInfo: async (installed_app_id) => {
          return {
            cell_info: weClient.renderInfo.appletClient.cachedAppInfo.cell_info
          }
        }
      }
      const { dnaConfig } = await sniffHolochainAppCells(mockConn, weAppId)
      console.log("dna config", dnaConfig)

      const extensionResolvers = await bindResolvers(dnaConfig as ExtendedDnaConfig, weAppWebsocketUrl)

      const autoConnectInput = {
        weaveAppAgentClient: {...weClient.renderInfo.appletClient, 
          callZome: weClient.renderInfo.appletClient.callZome,
          appWebsocket: mockConn},
        appID: weAppId,
        extensionSchemas,
        extensionResolvers,
        conductorUri: weAppWebsocketUrl,
        adminConductorUri: undefined,
      }

      console.log("autoconnect input", autoConnectInput)

      const output = await autoConnect(autoConnectInput)
      // autoconnect ends

      console.log("output", output)
      await setClient(output)

      return {
        client: output
      }
      
    } else if (appPort) {
      console.log("adminPort is", adminPort)
      console.log("url is", url)
      console.log("appId is", appId)

      if (adminPort) {
        const adminWebsocket = await AdminWebsocket.connect({url: new URL(`ws://localhost:${adminPort}`)})
        const cellIds = await adminWebsocket.listCellIds()
        await adminWebsocket.authorizeSigningCredentials(cellIds[0])
        await adminWebsocket.authorizeSigningCredentials(cellIds[1])
        await adminWebsocket.authorizeSigningCredentials(cellIds[2])
      }
        console.log("authorized three cells")
      } else {
        console.log("no admin port")
      }
       
      // pull DNA config separately in order to bind to CFN-specific extension Cells\
      let adminConn = await AdminWebsocket.connect({url: new URL(`ws://localhost:${adminPort}`), defaultTimeout: 999999999})
      let tokenResp = await adminConn.issueAppAuthenticationToken({
        installed_app_id: appId,
      });
      let token = tokenResp.token;

      const conn = await AppWebsocket.connect({url: new URL(url), token: token})
      const { dnaConfig } = await sniffHolochainAppCells(conn, appId)
      let boundResolvers = await bindResolvers(dnaConfig as ExtendedDnaConfig, url)
      const autoConnectInput = {
        weaveAppAgentClient: undefined,
        appID: appId,
        extensionSchemas,
        extensionResolvers: boundResolvers,
        conductorUri: url,
        adminConductorUri: new URL(`ws://localhost:${adminPort}`),
      }
      const output = await autoConnect(autoConnectInput)
      await setClient(output)
      return {
        client: output
      }
  } catch (e) {
    console.error("Holochain connection error", e)
    throw error(500, "Holochain connection error")
  }
    
}
