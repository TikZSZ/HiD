import { PrivateKey } from "@hashgraph/sdk";
import localforage from "localforage";

// Helper function to prefix storage keys with userId
export function getUserScopedKey ( userId: string, id: string ): string
{
  return `${userId}:${id}`;
}


// Key types and associated metadata
export enum KeyType
{
  ENCRYPTION = "encryption",
  SIGNING = "signing",
  ENCRYPTION_AND_SIGNING = "encryption & signing",
}

export interface KeyMetadata
{
  id: string; // Unique ID for the key
  name: string; // Key name
  type: KeyType; // Key purpose
  createdAt: Date; // Key creation date
  description?: string; // Optional description
  associatedDIDs?: string[]; // Associated DIDs
  associatedOrganizations?: string[]; // Associated organizations
  purposes?: KeyPurpose[]; // Key purposes
  publicKey:string;
}
export type OmmitedKeyMeta = Omit<KeyMetadata, "id" | "createdAt" | "type"|"publicKey">
export enum KeyPurpose
{
  AUTHENTICATION = "authentication",
  ASSERTION = "assertion",
  KEY_AGREEMENT = "key_agreement",
  CAPABILITY_DELEGATION = "capability_delegation",
  CAPABILITY_INVOCATION = "capability_invocation",
}

const STORAGE_KEY = "key_storage";
const IV_LENGTH = 12; // Length of initialization vector for AES-GCM

// Initialize IndexedDB storage
const storage = localforage.createInstance( {
  name: "KeyStorage",
  storeName: STORAGE_KEY,
} );

// Derive an AES key from a password
async function deriveAESKey ( password: string, salt: Uint8Array ): Promise<CryptoKey>
{
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode( password ),
    { name: "PBKDF2" },
    false,
    [ "deriveKey" ]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    [ "encrypt", "decrypt" ]
  );
}

// Common function to save keys
async function saveKey (
  userId: string,
  metadata: KeyMetadata,
  privateKey: ArrayBuffer,
  publicKey: ArrayBuffer,
  password: string
): Promise<KeyMetadata>
{
  const salt = window.crypto.getRandomValues( new Uint8Array( 16 ) );
  const aesKey = await deriveAESKey( password, salt );
  const iv = window.crypto.getRandomValues( new Uint8Array( IV_LENGTH ) );
  const encryptedPrivateKey = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    privateKey
  );
  const scopedKey = getUserScopedKey( userId, metadata.id );
  await storage.setItem( scopedKey, {
    metadata,
    encryptedPrivateKey,
    publicKey,
    salt,
    iv,
  } );

  return metadata;
}

async function updateKey (
  userId: string,
  metadata: KeyMetadata,
): Promise<KeyMetadata>
{
  const scopedKey = getUserScopedKey( userId, metadata.id );
  const {metadata:savedMetadata,...rest} = (await storage.getItem<{metadata:KeyMetadata} & Object>(scopedKey))! 
  await storage.setItem( scopedKey, {...rest,metadata } );
  return metadata;
}

// Generate RSA key pair and save it
export async function generateRSAKey (
  userId: string,
  password: string,
  metadata: OmmitedKeyMeta,
): Promise<KeyMetadata>
{
  const id = crypto.randomUUID();
  const createdAt = new Date();
  const textDecoder = new TextDecoder()
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 2048,
      publicExponent: new Uint8Array( [ 0x01, 0x00, 0x01 ] ),
      hash: { name: "SHA-256" },
    },
    true,
    [ "sign", "verify" ]
  );

  const publicKey = await window.crypto.subtle.exportKey( "spki", keyPair.publicKey );
  const privateKey = await window.crypto.subtle.exportKey( "pkcs8", keyPair.privateKey );

  return saveKey(
    userId,
    { ...metadata, id, createdAt, type: KeyType.ENCRYPTION_AND_SIGNING,publicKey:textDecoder.decode(publicKey) },
    privateKey,
    publicKey,
    password
  );
}

// Generate Ed25519 key pair and save it
export async function generateEd25519Key (
  userId: string,
  password: string,
  metadata: OmmitedKeyMeta
): Promise<KeyMetadata>
{
  const id = crypto.randomUUID();
  const createdAt = new Date();

  // const keyPair = await window.crypto.subtle.generateKey(
  //   {
  //     name: "Ed25519",
  //   },
  //   true,
  //   [ "sign", "verify" ]
  // ) as CryptoKeyPair;

  // const publicKey = await window.crypto.subtle.exportKey( "raw", keyPair.publicKey );
  // const privateKey = await window.crypto.subtle.exportKey( "pkcs8", keyPair.privateKey );
  const privateKeyObj = await PrivateKey.generateED25519Async()
  const privateKey = privateKeyObj.toBytesDer()
  const publicKey = privateKeyObj.publicKey.toBytesDer()
  return saveKey(
    userId,
    { ...metadata, id, createdAt, type: KeyType.SIGNING,publicKey:privateKeyObj.publicKey.toStringDer() },
    privateKey,
    publicKey,
    password
  );
}

// Retrieve and decrypt a key
export async function retrieveKey ( userId: string, id: string, password: string )
{
  const scopedKey = getUserScopedKey( userId, id );
  const storedKey = await storage.getItem<{
    metadata: KeyMetadata;
    encryptedPrivateKey: ArrayBuffer;
    publicKey: ArrayBuffer;
    salt: Uint8Array;
    iv: Uint8Array;
  }>( scopedKey );

  if ( !storedKey )
  {
    throw new Error( "Key not found" );
  }

  const { encryptedPrivateKey, publicKey, salt, iv } = storedKey;

  const aesKey = await deriveAESKey( password, salt );

  const decryptedPrivateKey = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encryptedPrivateKey
  );


  // if ( storedKey.metadata.type === KeyType.SIGNING )
  // {
    
  // } 
  //else
  // {
  //   const importedPrivateKey = await window.crypto.subtle.importKey(
  //     "pkcs8",
  //     decryptedPrivateKey,
  //     { name: "RSA-PSS" },
  //     true,
  //     [ "sign" ]
  //   );

  //   const importedPublicKey = await window.crypto.subtle.importKey(
  //     "spki",
  //     publicKey,
  //     { name: "RSA-PSS" },
  //     true,
  //     [ "verify" ]
  //   );
  // }

  // return { privateKey: importedPrivateKey, publicKey: importedPublicKey };
  const privateKey = PrivateKey.fromBytes(new Uint8Array(decryptedPrivateKey))
  return { privateKey: privateKey, publicKey: privateKey.publicKey };
}

// List all stored keys with metadata
export async function listKeys ( userId: string ): Promise<KeyMetadata[]>
{
  const keys: KeyMetadata[] = [];
  // await storage.iterate((value: { metadata: KeyMetadata }) => {
  //   keys.push(value.metadata);
  // });
  await storage.iterate( ( value: { metadata: KeyMetadata }, key: string ) =>
  {
    if ( key.startsWith( `${userId}:` ) )
    {
      keys.push( value.metadata );
    }
  } );
  return keys;
}

// Delete a key by its ID
export async function deleteKey ( userId: string, keyId: string ): Promise<void>
{
  const scopedKey = getUserScopedKey( userId, keyId );
  await storage.removeItem( scopedKey );
}


export interface DIDKeyAssociation {
  didId: string;
  keyId: string;
  purposes: KeyPurpose[];
  isPrimary?: boolean;
}

export interface OrganizationKeyAssociation {
  orgId: string;
  keyId: string;
  roles: OrganizationKeyRole[];
  isPrimary?: boolean;
}

export enum OrganizationKeyRole {
  ISSUER = "issuer",
  VERIFIER = "verifier",
  ADMIN = "admin",
  MEMBER = "member",
}

// Create separate storage instances for different types of associations
const didKeyAssociationsStorage = localforage.createInstance({
  name: "DIDKeyAssociations",
  storeName: "did-key-associations",
});

const keyDIDIndexStorage = localforage.createInstance({
  name: "KeyDIDIndex",
  storeName: "key-did-index",
});

const organizationKeyAssociationsStorage = localforage.createInstance({
  name: "OrganizationKeyAssociations", 
  storeName: "org-key-associations",
});

const keyOrganizationIndexStorage = localforage.createInstance({
  name: "KeyOrganizationIndex",
  storeName: "key-org-index",
});

// Upsert DID-Key Association with Improved Indexing
export async function upsertDIDKeyAssociation(
  userId: string, 
  association: DIDKeyAssociation
): Promise<void> {
  const didScopedKey = getUserScopedKey(userId, association.didId);
  const keyScopedKey = getUserScopedKey(userId,association.keyId);

  // Store DID-Key Association
  const existingDIDAssociations = 
    (await didKeyAssociationsStorage.getItem<DIDKeyAssociation[]>(didScopedKey)) || [];
  
  const updatedDIDAssociations = existingDIDAssociations.map(a => 
    a.keyId === association.keyId ? association : a
  );
  
  if (!updatedDIDAssociations.find(a => a.keyId === association.keyId)) {
    updatedDIDAssociations.push(association);
  }
  
  await didKeyAssociationsStorage.setItem(didScopedKey, updatedDIDAssociations);

  // Update Key-DID Index
  const existingKeyDIDs = 
    (await keyDIDIndexStorage.getItem<string[]>(keyScopedKey)) || [];
  
  if (!existingKeyDIDs.includes(association.didId)) {
    existingKeyDIDs.push(association.didId);
    await keyDIDIndexStorage.setItem(keyScopedKey, existingKeyDIDs);
  }
}

// Find all DIDs associated with a specific key
export async function getDIDsForKey(userId:string,keyId: string): Promise<string[]> {
  const keyScopedKey = getUserScopedKey(userId,keyId);
  return (await keyDIDIndexStorage.getItem<string[]>(keyScopedKey)) || [];
}

// Retrieve DID-Key Associations
export async function getDIDKeyAssociations(
  userId: string, 
  didId: string
): Promise<DIDKeyAssociation[]> {
  const scopedKey = getUserScopedKey(userId, didId);
  return (await didKeyAssociationsStorage.getItem<DIDKeyAssociation[]>(scopedKey)) || [];
}

// Similar pattern for Organization Key Associations
export async function upsertOrganizationKeyAssociation(
  userId: string, 
  association: OrganizationKeyAssociation
): Promise<void> {
  const orgScopedKey = getUserScopedKey(userId, association.orgId);
  const keyScopedKey = getUserScopedKey(userId,association.keyId);

  // Store Organization-Key Association
  const existingOrgAssociations = 
    (await organizationKeyAssociationsStorage.getItem<OrganizationKeyAssociation[]>(orgScopedKey)) || [];
  
  const updatedOrgAssociations = existingOrgAssociations.map(a => 
    a.keyId === association.keyId ? association : a
  );
  
  if (!updatedOrgAssociations.find(a => a.keyId === association.keyId)) {
    updatedOrgAssociations.push(association);
  }
  
  await organizationKeyAssociationsStorage.setItem(orgScopedKey, updatedOrgAssociations);

  // Update Key-Organization Index
  const existingKeyOrgs = 
    (await keyOrganizationIndexStorage.getItem<string[]>(keyScopedKey)) || [];
  
  if (!existingKeyOrgs.includes(association.orgId)) {
    existingKeyOrgs.push(association.orgId);
    await keyOrganizationIndexStorage.setItem(keyScopedKey, existingKeyOrgs);
  }
}

// Find all Organizations associated with a specific key
export async function getOrganizationsForKey(userId:string,keyId: string): Promise<string[]> {
  const keyScopedKey = getUserScopedKey(userId,keyId);
  return (await keyOrganizationIndexStorage.getItem<string[]>(keyScopedKey)) || [];
}

// Get Organization-Key Associations
export async function getOrganizationKeyAssociations(
  userId: string, 
  orgId: string
): Promise<OrganizationKeyAssociation[]> {
  const scopedKey = getUserScopedKey(userId, orgId);
  return (await organizationKeyAssociationsStorage.getItem<OrganizationKeyAssociation[]>(scopedKey)) || [];
}

const STORAGE_KEYY = "DB_STORAGE";
const DID_KEY = "dids"

function getDIDKey(userId:string){
  return DID_KEY+ "/"+userId
}

const db = localforage.createInstance({driver:localforage.INDEXEDDB,storeName:STORAGE_KEY})

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