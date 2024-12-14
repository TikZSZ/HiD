import { PrivateKey } from "@hashgraph/sdk";
import localforage, { key } from "localforage";
import AppwriteSerivce, { CreateDIDDto, CreateOrganizationDto } from "./appwrite/service"
import { KeyPurpose, KeyType, OrganizationRole, KeyAlgorithm } from "./appwrite/service"
import { Base64 } from "js-base64";
import * as Bls12381Multikey from "@digitalbazaar/bls12-381-multikey"
import * as ED25519Multikey from "@digitalbazaar/ed25519-multikey"
export { KeyPurpose, KeyType, OrganizationRole, KeyAlgorithm }
import { base58_to_binary, binary_to_base58 } from "base58-js"

// Helper function to prefix storage keys with userId
export function getUserScopedKey ( userId: string, id: string ): string
{
  return `${userId}:${id}`;
}

export interface KeyPair {
  publicKeyMultibase:string,
  secretKeyMultibase:string,
  publicKey:Uint8Array
  secretKey:Uint8Array
  export:any
  signer:() => {
    id?:string
    algorithm:string,
    sign:(param:{data:Uint8Array}) => Uint8Array
  }
  verifier:() => {
    id?:string
    algorithm:string,
    verify:(param:{data:Uint8Array,signature:Uint8Array}) => boolean
  }
}
export interface KeyMetadata
{
  $id: string,
  $createdAt: string,
  name: string; // Key name
  description?: string; // Optional description
  keyType: KeyType[]; // Key purpose
  keyAlgorithm: KeyAlgorithm;
  keyPurposes?: KeyPurpose[]; // Key purposes
  publicKey: string;
}
export type OmmitedKeyMeta = Omit<KeyMetadata, "$id" | "type" | "publicKey"|"keyType" | "$createdAt">


const STORAGE_KEY = "key_storage";
const IV_LENGTH = 12; // Length of initialization vector for AES-GCM


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

function encodeBase64 ( input: Uint8Array )
{
  return Base64.fromUint8Array( input )
}
function decodeBase64 ( input: string )
{
  return Base64.toUint8Array( input )
}
// Common function to save keys
async function saveKey (
  userId: string,
  metadata: KeyMetadata,
  privateKey: ArrayBuffer | Uint8Array,
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

  const key = await AppwriteSerivce.createKey( userId, { salt: encodeBase64( salt ), iv: encodeBase64( iv ), encryptedPrivateKey: encodeBase64( new Uint8Array( encryptedPrivateKey ) ), ...metadata } )

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
    { ...metadata, keyType: [ KeyType.ENCRYPTION, KeyType.SIGNING ], publicKey: textDecoder.decode( publicKey ) } as any,
    privateKey,
    password
  );
}

export async function generateKey ( userId: string,
  password: string,
  metadata: OmmitedKeyMeta )
{
  let keyPair:KeyPair
  let exported
  let keyType:KeyType[] = []
  if ( metadata.keyAlgorithm === KeyAlgorithm.ED25519 )
  {
    keyPair = await ED25519Multikey.generate()
    exported = await keyPair.export( { publicKey: true, secretKey: true } )
    keyType = [ KeyType.SIGNING ]
  } else if ( metadata.keyAlgorithm === KeyAlgorithm.BBS_2023 )
  {
        
    keyPair = await Bls12381Multikey.generateBbsKeyPair({algorithm: Bls12381Multikey.ALGORITHMS.BBS_BLS12381_SHA256})
    exported = await keyPair.export( { publicKey: true, secretKey: true } )
    keyType = [ KeyType.SIGNING,KeyType.SELECTIVE_DISCLOSURE ]
  }
  const privateKey = exported.secretKeyMultibase
  const publicKey = exported.publicKeyMultibase
  return saveKey(
    userId,
    { ...metadata, keyType, publicKey: publicKey } as any,
    base58_to_binary( privateKey ),
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


  const privateKeyObj = await PrivateKey.generateED25519Async()
  const privateKey = privateKeyObj.toBytesDer()
  return saveKey(
    userId,
    { ...metadata, keyType: [KeyType.SIGNING],publicKey:privateKeyObj.publicKey.toStringDer() } as any,
    privateKey,
    password
  );
  // const ed25519MultikeyPair = await ED25519Multikey.generate()
  // const exported = await ed25519MultikeyPair.export( { publicKey: true, secretKey: true } )
  // const privateKey = exported.secretKeyMultibase
  // const publicKey = exported.publicKeyMultibase
  // return saveKey(
  //   userId,
  //   { ...metadata, keyType: [ KeyType.SIGNING ], publicKey: publicKey } as any,
  //   base58_to_binary( privateKey ),
  //   password
  // );
}


// Retrieve and decrypt a key
export async function retrieveKey ( userId: string, id: string, password: string )
{
  const storedKey = await AppwriteSerivce.getKey( userId, id )

  if ( !storedKey )
  {
    throw new Error( "Key not found" );
  }

  const { encryptedPrivateKey, publicKey, salt, iv } = storedKey;

  const aesKey = await deriveAESKey( password, decodeBase64( salt ) );

  const decryptedPrivateKey = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64( iv ) },
    aesKey,
    decodeBase64( encryptedPrivateKey )
  );
  let keyPair:KeyPair
  const privateKey = binary_to_base58( new Uint8Array(decryptedPrivateKey) )
  console.log(publicKey,privateKey)
  if ( storedKey.keyAlgorithm === KeyAlgorithm.ED25519 )
  {
    keyPair = await ED25519Multikey.from( { secretKeyMultibase: privateKey, publicKeyMultibase: publicKey } )
  } else if ( storedKey.keyAlgorithm === KeyAlgorithm.BBS_2023 )
  {
    keyPair = await Bls12381Multikey.from( { secretKeyMultibase: privateKey, publicKeyMultibase: publicKey } )
  }
  if(!keyPair) throw new Error("keyPair not found")
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
  // const privateKey = PrivateKey.fromBytes(new Uint8Array(decryptedPrivateKey))
  // return { privateKey: privateKey, publicKey: privateKey.publicKey };
  return { privateKey, publicKey: publicKey, keyPair };
}

// List all stored keys with metadata
export async function listKeys ( userId: string )
{
  const keys = await AppwriteSerivce.getKeys( userId )
  return keys
}

// Delete a key by its ID
export async function deleteKey ( userId: string, keyId: string )
{
  await AppwriteSerivce.deleteKey( userId, keyId )
  return
}


// Find all DIDs associated with a specific key
export async function getDIDsForKey ( userId: string, keyId: string )
{
  return ( await AppwriteSerivce.getKey( userId, keyId ) ).dids
}

// Retrieve DID-Key Associations
export async function getKeysForDID (
  userId: string,
  didId: string
)
{
  return ( await AppwriteSerivce.getDID( userId, didId ) ).keys
}
// Find all Organizations associated with a specific key
export async function getOrganizationsForKey ( ownerId: string, keyId: string )
{
  return ( await AppwriteSerivce.getOrganizationsForKey( ownerId, keyId ) )

}
// Get Organization-Key Associations
export async function getKeysForOrg (
  userId: string,
  orgId: string
)
{
  return ( await AppwriteSerivce.getKeysForOrgAndUser( userId, orgId ) )
}

export async function createOrg ( userId: string, data: CreateOrganizationDto )
{
  return AppwriteSerivce.createOrganization( userId, data )
}

export async function associateKeyWithDID ( userId: string, didId: string, keyId: string )
{
  return AppwriteSerivce.associateKeyWithDID( didId, keyId, userId )
}
export async function linkOrganizationKey ( userId: string, orgId: string, keyId: string )
{
  return AppwriteSerivce.linkOrganizationKey( orgId, keyId, userId )
}
export async function getDIDs ( userId: string )
{
  return AppwriteSerivce.getDIDs( userId )
}

export async function upsertDID ( userId: string, did: CreateDIDDto )
{
  return AppwriteSerivce.createDID( userId, did )
}