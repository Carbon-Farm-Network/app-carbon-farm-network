import { browser } from '$app/environment'
import { error } from '@sveltejs/kit'
import { AppWebsocket, AdminWebsocket } from '@holochain/client'
import { appletServices } from '../../we';
import { onMount } from 'svelte';
import { WeaveClient, isWeContext, initializeHotReload, type WAL} from '@lightningrodlabs/we-applet';
import { setClient, setClientHC } from "../crud/store"

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
      await setClientHC(weClient.renderInfo.appletClient)
      return {
        client: weClient.renderInfo.appletClient,
      }
    } else if (appPort) {
      console.log("adminPort is", adminPort)
      console.log("url is", url)
      console.log("appId is", appId)

      if (adminPort) {
        const adminWebsocket = await AdminWebsocket.connect({url: new URL(`ws://localhost:${adminPort}`)})
        const cellIds = await adminWebsocket.listCellIds()
        console.log("cellIds", cellIds)
        await adminWebsocket.authorizeSigningCredentials(cellIds[0])
        console.log("authorized one cell")
        await adminWebsocket.authorizeSigningCredentials(cellIds[1])
        console.log("authorized two cells")
        await adminWebsocket.authorizeSigningCredentials(cellIds[2])
        console.log("authorized three cells")
        // await adminWebsocket.authorizeSigningCredentials(cellIds[3])
        // console.log("authorized four cells")
      }
        console.log("authorized all cells")
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
      setClientHC(conn)
      return {
        client: conn,
      }
  } catch (e) {
    console.error("Holochain connection error", e)
    throw error(500, "Holochain connection error")
  }
    
}
