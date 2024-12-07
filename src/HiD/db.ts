import localForage from "localforage";
import { getUserScopedKey } from "./keyManager";

const STORAGE_KEY = "DB_STORAGE";
const DID_KEY = "dids"

function getDIDKey(userId:string){
  return DID_KEY+ "/"+userId
}

const db = localForage.createInstance({driver:localForage.INDEXEDDB,storeName:STORAGE_KEY})

export interface IDID {
  id:string,
  identifier:string,
  publicKey:string,
  keyId:string
}

export async function getDIDs(userId:string) {
  const DIDs:IDID[] = []
  await db.iterate( ( value: IDID, key: string ) =>
    {
      if ( key.startsWith( `${userId}:` ) )
      {
        DIDs.push( value );
      }
    } );
  // return db.getItem<DID[]>(getDIDKey((userId)))
  return DIDs
}

export async function upsertDID(userId:string,did:IDID) {
  const scopedKey = getUserScopedKey(userId,did.id)
  const dids = await db.getItem<IDID>(scopedKey)
  if(!dids){
    db.setItem<IDID>(scopedKey,did)
    return
  }
  db.setItem<IDID>(scopedKey,did)
}

