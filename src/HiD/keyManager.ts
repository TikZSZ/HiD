import { PrivateKey } from "@hashgraph/sdk";
import localforage, { key } from "localforage";
import AppwriteSerivce, { CreateDIDDto, CreateOrganizationDto } from "./appwrite/service"
import  {KeyPurpose,KeyType,OrganizationRole} from "./appwrite/service"
import { Base64 } from "js-base64";
export {KeyPurpose,KeyType,OrganizationRole}
// Helper function to prefix storage keys with userId
export function getUserScopedKey ( userId: string, id: string ): string
{
  return `${userId}:${id}`;
}


export interface KeyMetadata
{
  $id:string,
  $createdAt:string,
  name: string; // Key name
  description?: string; // Optional description
  keyType: KeyType; // Key purpose
  keyPurposes?: KeyPurpose[]; // Key purposes
  publicKey:string;
}
export type OmmitedKeyMeta = Omit<KeyMetadata,"$id"|"type"|"publicKey"|"$createdAt">


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

function encodeBase64(input:Uint8Array){
  return Base64.fromUint8Array(input)
}
function decodeBase64(input:string){
  return Base64.toUint8Array(input)
}
// Common function to save keys
async function saveKey (
  userId: string,
  metadata: KeyMetadata,
  privateKey: ArrayBuffer|Uint8Array,
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
  
  const key = await AppwriteSerivce.createKey(userId,{salt:encodeBase64(salt),iv:encodeBase64(iv),encryptedPrivateKey:encodeBase64(new Uint8Array(encryptedPrivateKey)),...metadata})

  return key;
}

// async function updateKey (
//   userId: string,
//   metadata: KeyMetadata,
// ): Promise<KeyMetadata>
// {
//   const scopedKey = getUserScopedKey( userId, metadata.id );
//   const {metadata:savedMetadata,...rest} = (await storage.getItem<{metadata:KeyMetadata} & Object>(scopedKey))! 
//   await storage.setItem( scopedKey, {...rest,metadata } );
//   return metadata;
// }

// Generate RSA key pair and save it
export async function generateRSAKey (
  userId: string,
  password: string,
  metadata: OmmitedKeyMeta,
): Promise<KeyMetadata>
{
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
    { ...metadata, keyType: KeyType.ENCRYPTION_AND_SIGNING,publicKey:textDecoder.decode(publicKey)} as any,
    privateKey,
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
  return saveKey(
    userId,
    { ...metadata, keyType: KeyType.SIGNING,publicKey:privateKeyObj.publicKey.toStringDer() } as any,
    privateKey,
    password
  );
}

// Retrieve and decrypt a key
export async function retrieveKey ( userId: string, id: string, password: string )
{
  const storedKey = await AppwriteSerivce.getKey(userId,id)

  if ( !storedKey )
  {
    throw new Error( "Key not found" );
  }

  const { encryptedPrivateKey, publicKey, salt, iv } = storedKey;

  const aesKey = await deriveAESKey( password, decodeBase64(salt) );

  const decryptedPrivateKey = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv:decodeBase64(iv) },
    aesKey,
    decodeBase64(encryptedPrivateKey)
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
export async function listKeys ( userId: string )
{
  const keys = await AppwriteSerivce.getKeys(userId)
  return keys
}

// Delete a key by its ID
export async function deleteKey ( userId: string, keyId: string )
{
  return AppwriteSerivce.deleteKey(userId,keyId)
}


// Find all DIDs associated with a specific key
export async function getDIDsForKey(userId:string,keyId: string) {
  return (await AppwriteSerivce.getKey(userId,keyId)).dids
}

// Retrieve DID-Key Associations
export async function getKeysForDID(
  userId: string, 
  didId: string
){
  return (await AppwriteSerivce.getDID(userId,didId)).keys
}
// Find all Organizations associated with a specific key
export async function getOrganizationsForKey(ownerId:string,keyId: string) {
  return (await AppwriteSerivce.getOrganizationsForKey(ownerId,keyId))
  
}
// Get Organization-Key Associations
export async function getKeysForOrg(
  userId: string, 
  orgId: string
) {
  return (await AppwriteSerivce.getKeysForOrg(userId,orgId)).documents
}

export async function createOrg(userId:string,data:CreateOrganizationDto){
  return AppwriteSerivce.createOrganization(userId,data)
}

export async function associateKeyWithDID(userId:string,didId:string,keyId:string){
  return AppwriteSerivce.associateKeyWithDID(didId,keyId,userId)
}
export async function linkOrganizationKey(userId:string,orgId:string,keyId:string) {
  return AppwriteSerivce.linkOrganizationKey(orgId,keyId,userId)
}
export async function getDIDs(userId:string) {
  return AppwriteSerivce.getDIDs(userId)
}

export async function upsertDID(userId:string,did:CreateDIDDto) {
  return AppwriteSerivce.createDID(userId,did)
}