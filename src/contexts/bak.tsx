import React, { createContext, useContext, useState, useEffect } from 'react';
import * as KeyManager from '@/HiD/keyManager';
import { PrivateKey, PublicKey } from '@hashgraph/sdk';
import AppwriteService,{DIDDocument,OrganizationDocument,KeyDocument,CreateDIDDto, KeyType, CreateOrganizationDto,OrganizationWithRoles} from "@/HiD/appwrite/service"
// Types for context
interface KeyContextType
{
  userId: string;
  keys: KeyDocument[];
  dids: DIDDocument[]
  orgs:OrganizationWithRoles[]
  isOpen:boolean;
  setIsOpen:(val:boolean) => void
  getDIDs (): Promise<void>
  getOrgs (): Promise<void>
  upsertOrg ( did: CreateOrganizationDto ): Promise<OrganizationDocument>
  upsertDID ( did: CreateDIDDto ): Promise<DIDDocument>
  // didAssociations: { [ key: string ]: string[] };
  // orgAssociations: { [ key: string ]: string[] };
  listKeys: () => Promise<void>;
  retrieveKey: ( id: string, password: string ) => Promise<{ publicKey: PublicKey, privateKey: PrivateKey }>;
  generateKey: ( type: 'RSA' | 'Ed25519', metadata: Omit<KeyManager.OmmitedKeyMeta,"keyType">, password: string ) => Promise<void>;
  deleteKey: ( keyId: string ) => Promise<void>;
  getAssociations: ( type: 'DID' | 'Organization', keyId: string ) => Promise<void>;
  addAssociation: ( type: 'DID' | 'Organization', toId: string,withId:string ) => Promise<void>;
  deleteAssociation: ( type: 'DID' | 'Organization', id: string, keyId: string ) => Promise<void>;
  openDIDWalletManager: () => void;
  closeDIDWalletManager: () => void;
}

// Initial context
const KeyContext = createContext<KeyContextType | undefined>( undefined );

export const useKeyContext = () =>
{
  const context = useContext( KeyContext );
  if ( !context ) throw new Error( 'KeyContext must be used within a KeyProvider' );
  return context;
};

// Provider component
export const KeyProvider: React.FC<{ userId: string, children: React.ReactElement }> = ( { userId, children } ) =>
{
  const [ keys, setKeys ] = useState<KeyDocument[]>( [] );
  // const [ didAssociations, setDIDAssociations ] = useState<{ [ key: string ]: DIDDocument[] }>( {} );
  // const [ orgAssociations, setOrgAssociations ] = useState<{ [ key: string ]: OrganizationDocument[] }>( {} );
  const [ dids, setDIDs ] = useState<DIDDocument[]>( [] )
  const [ orgs, setOrgs ] = useState<OrganizationWithRoles[]>( [] )

  const listKeys = async () =>
  {
    const userKeys = await KeyManager.listKeys( userId );
    setKeys( userKeys );
  };

  const [isOpen, setIsOpen] = useState(false);
  const openDIDWalletManager = () => setIsOpen(true);
  const closeDIDWalletManager = () => setIsOpen(false);

  const generateKey = async ( type: 'RSA' | 'Ed25519', metadata: Omit<KeyManager.OmmitedKeyMeta,"keyType">, password: string ) =>
  {
    if ( type === 'RSA' )
    {
      await KeyManager.generateRSAKey( userId, password, {...metadata,keyType:KeyType.ENCRYPTION_AND_SIGNING} );
    } else
    {
      await KeyManager.generateEd25519Key( userId, password, {...metadata,keyType:KeyType.SIGNING} );
    }
    await listKeys(); // Refresh keys
  };

  const deleteKey = async ( keyId: string ) =>
  {
    await KeyManager.deleteKey( userId, keyId );
    await listKeys(); // Refresh keys
  };

  const getAssociations = async ( type: 'DID' | 'Organization', keyId: string ) =>
  {
    if ( type === 'DID' )
    {
      const dids = await KeyManager.getDIDsForKey( userId, keyId )
      console.log( dids )
      // setDIDAssociations( ( d ) => ( { ...d, [ keyId ]: dids } ) )
    } else
    {
      const orgAssos = await KeyManager.getOrganizationsForKey( userId, keyId )
      // setOrgAssociations( ( o ) => ( { ...o, [ keyId ]: orgAssos } ) )
    }
  };

  const addAssociation = async ( type: 'DID' | 'Organization', toId: string, withId: string ) =>
  {
    if ( type === 'DID' )
    {

      await KeyManager.associateKeyWithDID( userId, toId, withId );
    } else
    {
      await KeyManager.linkOrganizationKey( userId, toId, withId );
    }
    // await getAssociations( type === 'DID' ? "DID" : "Organization", withId );
    await listKeys()
  };

  const deleteAssociation = async ( type: 'DID' | 'Organization', id: string, keyId: string ) =>
  {
    // if (type === 'DID') {
    //   await KeyManager.deleteDIDKeyAssociation(userId, id, keyId);
    // } else {
    //   await KeyManager.deleteOrganizationKeyAssociation(userId, id, keyId);
    // }
    // await getAssociations(type, id);
  };

  const retrieveKey = async ( id: string, password: string ) =>
  {
    return KeyManager.retrieveKey( userId, id, password )
  }

  async function getDIDs ()
  {
    const dids = await KeyManager.getDIDs( userId )
    setDIDs( dids )
  }

  async function getOrgs ()
  {
    const orgs = await AppwriteService.getOrgnisations( userId )
    setOrgs( orgs )
  }

  async function upsertOrg(data:CreateOrganizationDto){
    const org = await AppwriteService.createOrganization( userId,data )
    setOrgs([...orgs,org])
    return org
  }

  async function upsertDID ( did: DIDDocument )
  {
    const didd = await KeyManager.upsertDID( userId, did )
    setDIDs([...dids,didd])
    return didd
  }

  useEffect( () =>
  {
    // listKeys();
    // getDIDs();
    // getOrgs();
  }, [ userId ] );


  return (
    <KeyContext.Provider value={{
      userId,
      keys,
      dids,
      orgs,
      isOpen,
      listKeys,
      generateKey,
      deleteKey,
      getAssociations,
      getDIDs,
      upsertDID,
      getOrgs,
      upsertOrg,
      addAssociation,
      deleteAssociation,
      retrieveKey,
      setIsOpen,
      openDIDWalletManager,
      closeDIDWalletManager 
    }}>
      {children}
    </KeyContext.Provider>
  );
};
