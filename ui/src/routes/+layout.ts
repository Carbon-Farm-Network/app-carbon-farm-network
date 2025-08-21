import { browser } from '$app/environment'
import { error } from '@sveltejs/kit'
import { AppWebsocket, AdminWebsocket } from '@holochain/client'
import { appletServices } from '../../we';
import { onMount } from 'svelte';
import { WeaveClient, isWeaveContext, initializeHotReload, type WAL} from '@theweave/api';
import { setClient, setClientHC } from "../crud/store"
import { createHolochainSchema } from '@valueflows/vf-graphql-holochain';
import { SchemaLink } from '@apollo/client/link/schema';
import { ApolloClient, InMemoryCache } from "@apollo/client/core";

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
    let conn;
    if (isWeaveContext()) {
      weClient = await WeaveClient.connect(appletServices);
      await setClientHC(weClient.renderInfo.appletClient)
      console.log("Weave client connected", weClient.renderInfo.appletClient)
      conn = weClient.renderInfo.appletClient;
      // return {
      //   client: weClient.renderInfo.appletClient,
      // }
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
      
      // pull DNA config separately in order to bind to CFN-specific extension Cells
      let adminConn = await AdminWebsocket.connect({url: new URL(`ws://localhost:${adminPort}`), defaultTimeout: 999999999})
      let tokenResp = await adminConn.issueAppAuthenticationToken({
        installed_app_id: appId,
      });
      let token = tokenResp.token;
  
      conn = await AppWebsocket.connect({
        url: new URL(url), 
        token: token,
        defaultTimeout: 999999999
      })
      console.log("Holochain app connected", conn)
      await setClientHC(conn)
    } else {
      console.log("no admin port")
      console.log("Connecting to Holochain app at", url)
      
    }


      const cache = new InMemoryCache({
        typePolicies: {
          Commitment: {
            keyFields: ['revisionId'],
          },
          Process: {
            keyFields: ['revisionId'],
          },
        },
      });
      const apolloClient = new ApolloClient({
        cache
      });
      setClient(apolloClient);

      const schema = createHolochainSchema(
        {
          appWebSocket: conn,
          roleName: 'hrea'
        }
      );

      apolloClient.setLink(
        new SchemaLink(
          { schema }
        )
      );

      return {
        // client: conn,
        client: apolloClient
      }
  } catch (e) {
    console.error("Holochain connection error", e)
    throw error(500, "Holochain connection error")
  }
    
}
