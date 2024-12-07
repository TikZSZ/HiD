import React, { createContext, useContext, useState, useEffect } from 'react';
import * as KeyManager from '@/HiD/keyManager';
import { PrivateKey, PublicKey } from '@hashgraph/sdk';
import * as DB from "@/HiD/db"
// Types for context
interface KeyContextType {
  userId: string;
  keys: KeyManager.KeyMetadata[];
  dids:DB.IDID[]
  getDIDs():Promise<void>
  upsertDID(did:DB.IDID):Promise<void>
  didAssociations: {[key:string]:string[]};
  orgAssociations: {[key:string]:string[]};
  listKeys: () => Promise<void>;
  retrieveKey: (id: string, password: string) => Promise<{publicKey:PublicKey,privateKey:PrivateKey}>;
  generateKey: (type: 'RSA' | 'Ed25519', metadata:KeyManager.OmmitedKeyMeta, password: string) => Promise<void>;
  deleteKey: (keyId: string) => Promise<void>;
  getAssociations: (type: 'DID' | 'Organization', lookupType:"KeyScope"|"DocScope",id: string) => Promise<KeyManager.DIDKeyAssociation[] | KeyManager.OrganizationKeyAssociation[]>;
  addAssociation: (type: 'DID' | 'Organization', association: KeyManager.DIDKeyAssociation | KeyManager.OrganizationKeyAssociation) => Promise<void>;
  deleteAssociation: (type: 'DID' | 'Organization', id: string, keyId: string) => Promise<void>;
}

// Initial context
const KeyContext = createContext<KeyContextType | undefined>(undefined);

export const useKeyContext = () => {
  const context = useContext(KeyContext);
  if (!context) throw new Error('KeyContext must be used within a KeyProvider');
  return context;
};

// Provider component
export const KeyProvider: React.FC<{ userId: string,children:React.ReactElement }> = ({ userId, children }) => {
  const [keys, setKeys] = useState<KeyManager.KeyMetadata[]>([]);
  const [didAssociations, setDIDAssociations] = useState<{[key:string]:string[]}>({});
  const [orgAssociations, setOrgAssociations] = useState<{[key:string]:string[]}>({});
  const [dids,setDIDs] = useState<DB.IDID[]>([])

  const listKeys = async () => {
    const userKeys = await KeyManager.listKeys(userId);
    setKeys(userKeys);
  };



  const generateKey = async (type: 'RSA' | 'Ed25519', metadata: KeyManager.OmmitedKeyMeta, password: string) => {
    if (type === 'RSA') {
      await KeyManager.generateRSAKey(userId, password, metadata);
    } else {
      await KeyManager.generateEd25519Key(userId, password, metadata);
    }
    await listKeys(); // Refresh keys
  };

  const deleteKey = async (keyId: string) => {
    await KeyManager.deleteKey(userId, keyId);
    await listKeys(); // Refresh keys
  };

  const getAssociations = async (type: 'DID' | 'Organization', lookupType:"KeyScope"|"DocScope",id: string) => {
    if (type === 'DID') {
      // const associations = await KeyManager.getDIDKeyAssociations(userId, id);
      // setDIDAssociations(associations);
      // return associations
      if(lookupType === "KeyScope"){
        const dids = await KeyManager.getDIDsForKey(userId,id) 
        console.log(dids)
        setDIDAssociations((d)=>({...d,[id]:dids}))
      }
      return KeyManager.getDIDKeyAssociations(userId,id)
    } else {
      // const associations = await KeyManager.getOrganizationKeyAssociations(userId, id);
      // setOrgAssociations(associations);
      // return associations
      if(lookupType === "KeyScope"){
        const orgAssos = await KeyManager.getOrganizationsForKey(userId,id) 
        setOrgAssociations((o)=>({...o,[id]:orgAssos}))
      }
      return KeyManager.getOrganizationKeyAssociations(userId,id)
    }
  };

  const addAssociation = async (type: 'DID' | 'Organization', association: KeyManager.DIDKeyAssociation | KeyManager.OrganizationKeyAssociation) => {
    if (type === 'DID') {
      await KeyManager.upsertDIDKeyAssociation(userId, association as KeyManager.DIDKeyAssociation);
    } else {
      await KeyManager.upsertOrganizationKeyAssociation(userId, association as KeyManager.OrganizationKeyAssociation);
    }
    await getAssociations( type === 'DID' ? "DID":"Organization","KeyScope",association.keyId);
  };

  const deleteAssociation = async (type: 'DID' | 'Organization', id: string, keyId: string) => {
    // if (type === 'DID') {
    //   await KeyManager.deleteDIDKeyAssociation(userId, id, keyId);
    // } else {
    //   await KeyManager.deleteOrganizationKeyAssociation(userId, id, keyId);
    // }
    // await getAssociations(type, id);
  };

  const retrieveKey = async(id: string, password: string) => {
    return KeyManager.retrieveKey(userId,id,password)
  }

  async function getDIDs(){
    const dids = await DB.getDIDs(userId)
    setDIDs(dids)
  }

  async function upsertDID(did:DB.IDID){
    await DB.upsertDID(userId,did)
    await getDIDs()
  }

  useEffect(() => {
    listKeys();
    getDIDs()
  }, [userId]);

  useEffect(() => {
    (async () => {
      keys.map(async (key) => {
        const dA = await getAssociations("DID","KeyScope",key.id)
        const oA = await getAssociations("Organization","KeyScope",key.id)
      })
    })()
  }, [keys]);

  return (
    <KeyContext.Provider value={{
      userId,
      keys,
      didAssociations,
      orgAssociations,
      dids,
      listKeys,
      generateKey,
      deleteKey,
      getAssociations,
      getDIDs,
      upsertDID,
      addAssociation,
      deleteAssociation,
      retrieveKey, 
    }}>
      {children}
    </KeyContext.Provider>
  );
};
