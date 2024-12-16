
import
  {
    createDiscloseCryptosuite,
    createSignCryptosuite,
    createVerifyCryptosuite
  } from "@digitalbazaar/bbs-2023-cryptosuite"
import { klona } from 'klona';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import jsigs from 'jsonld-signatures';
const { purposes: { AssertionProofPurpose } } = jsigs;

import {cryptosuite as eddsaRdfc2022CryptoSuite} from
  '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import * as Bls12381Multikey from "@digitalbazaar/bls12-381-multikey"
import * as Ed25519Multikey from "@digitalbazaar/ed25519-multikey"

import
  {
    alumniCredential,
    bls12381MultikeyKeyPair,
    dlCredential,
    dlCredentialNoIds,
    achievementCredential,
    customCredential
  } from './mock-data';
import * as vc from '@digitalbazaar/vc';

const algorithm = Bls12381Multikey.ALGORITHMS.BBS_BLS12381_SHA256;

import { loader } from "./documentLoader"
import {HcsDid} from "../src/HiD/did-sdk/index"
import { Client, PrivateKey, Signer } from "@hashgraph/sdk";
import { documentLoader } from "./contexts";
loader.setProtocolHandler({protocol:"did:hedera",handler:{
  get:async ({url}:{url:string}) => ((await new HcsDid({identifier:url})).resolve())
}})
const hederDidDriver = {
  methodName:"hedera"
}
// const documentLoader = loader.build();
// console.log((await documentLoader("did:hedera:testnet:z5a8Rn45srQuWTfUwEMs3JtmBfjaNo75chp6DPpWh3D2x_0.0.5215105")))
// console.log((await documentLoader("did:hedera:testnet:z9qd1bB7ABC5mccHe3Chas1VDQusYc79ttDAsRRVA7MXm_0.0.5263305")))
// console.dir((await documentLoader('did:key:zUC76eySqgji6uNDaCrsWnmQnwq8pj1MZUDrRGc2BGRu61baZPKPFB7YpHawussp2YohcEMAeMVGHQ9JtKvjxgGTkYSMN53ZfCH4pZ6TGYLawvzy1wE54dS6PQcut9fxdHH32gi')),{depth:null})
// process.exit()
const publicEDDSAMultikeyKeyPair = {
  '@context': 'https://w3id.org/security/multikey/v1',
  type: 'Multikey',
  controller:"did:hedera:testnet:z9qd1bB7ABC5mccHe3Chas1VDQusYc79ttDAsRRVA7MXm_0.0.5263305",
  id: "did:hedera:testnet:z9qd1bB7ABC5mccHe3Chas1VDQusYc79ttDAsRRVA7MXm_0.0.5263305#did-root-key",
  publicKeyMultibase:"z6MkoHt4BRMbWjaEj78LimfRi73DEV9Q1zQFaE5oFhTB2aK9",
  secretKeyMultibase:"z6MktRSA4tfnnnmC2eVSX6JfXMyN8cz8q6avS1N3R4SvxhuA"
}

async function main ( credential: object, selectivePointers: string[], nullObj: object = {} )
{
  const keyPair = await Bls12381Multikey.from( {
    ...bls12381MultikeyKeyPair
  }, { algorithm } );
  const unsignedCredential = klona( credential );
  const cryptosuite = createSignCryptosuite({});
  const date = new Date().toISOString()
  const suite = new DataIntegrityProof( {
    signer: keyPair.signer(), cryptosuite
  } );

  let error;
  let signedCredential;

  signedCredential = await vc.issue( { credential: unsignedCredential, suite: suite, documentLoader: documentLoader } )
  console.dir( { error, signedCredential: { ...signedCredential, ...nullObj } }, { depth: null } )

  console.log( "\n =========\n", 'should derive a reveal document', "\n =========" )
  error;
  let revealed;
  async function reveal ()
  {
    const cryptosuite = createDiscloseCryptosuite( {
      selectivePointers: selectivePointers as any
    } );
    const suite = new DataIntegrityProof( { cryptosuite } );
    revealed = await vc.derive( { verifiableCredential: signedCredential, suite: suite, documentLoader: documentLoader } )

    // revealed = await jsigs.derive( signedCredential, {
    //   suite,
    //   purpose: new AssertionProofPurpose(),
    //   documentLoader
    // } );
    
    console.dir( { error, revealed: { ...revealed, ...nullObj } }, { depth: null } )
  }
  await reveal()
  console.log( "\n =========\n", 'should verify a document', "\n =========" )

  async function verify ()
  {
    const cryptosuite = createVerifyCryptosuite();
    const suite = new DataIntegrityProof( { cryptosuite } );
    const signedCredentialCopy = klona( revealed );
    const result = await vc.verifyCredential( {
      credential: signedCredentialCopy,
      suite, documentLoader: documentLoader,
      purpose: new AssertionProofPurpose()
    } );
    console.log( result.verified )
  }
  await verify()
  let vp;
  let presentation;
  const challenge = '12ec21'

  console.log( "\n =========\n", 'should issue a VP', "\n =========" )
  async function issueVP ()
  {
    const keyPair = await Ed25519Multikey.from( {
      ...publicEDDSAMultikeyKeyPair
    } );
    // keyPair.id = "did:hedera:testnet:z9qd1bB7ABC5mccHe3Chas1VDQusYc79ttDAsRRVA7MXm_0.0.5263305"
    // keyPair.controller = "keyPair"
    // const cryptosuite = ecdsaRdfc2019Cryptosuite()
    const suite = new DataIntegrityProof( {
      signer: keyPair.signer(), cryptosuite:eddsaRdfc2022CryptoSuite
    } );
    // console.log(keyPair)
    const id = bls12381MultikeyKeyPair.id;
    const holder = bls12381MultikeyKeyPair.controller;
    presentation = vc.createPresentation( {
      verifiableCredential: revealed, holder: "did:hedera:testnet:z9qd1bB7ABC5mccHe3Chas1VDQusYc79ttDAsRRVA7MXm_0.0.5263305", id: "did:hedera:testnet:z9qd1bB7ABC5mccHe3Chas1VDQusYc79ttDAsRRVA7MXm_0.0.5263305"
    } );
    // console.log((await canonize(rdf,{ algorithm: 'RDFC-1.0', })))
    vp = await vc.signPresentation( {
      presentation, suite, documentLoader, purpose: new AssertionProofPurpose()
    } );
    // console.dir( { error, vp: { ...vp, ...nullObj } }, { depth: null } )
  }
  await issueVP()

  console.log( "\n =========\n", 'should verify a VP', "\n =========" )
  async function verifyVP ()
  {
    const cryptosuite = createVerifyCryptosuite();
    const suite = new DataIntegrityProof( { cryptosuite:cryptosuite } );
    const suite2 = new DataIntegrityProof( { cryptosuite:eddsaRdfc2022CryptoSuite } );
    const result = await vc.verify( { presentation: vp, suite: [suite,suite2], documentLoader, presentationPurpose: new AssertionProofPurpose() } );
    console.dir( { error, vp: { ...vp, ...nullObj } }, { depth: null } )
    console.log( result.verified,result.error )
  }
  await verifyVP()
}

// main(dlCredential,[
//   '/credentialSubject/driverLicense/dateOfBirth',
//   '/credentialSubject/driverLicense/expirationDate'
// ],{proof:null,"@context":null})

main( customCredential, [
  "/issuer",
  "/credentialSubject/projectName",
  "/credentialSubject/certificationBody",
  "/credentialSubject/vCRR",
  "/credentialSubject/dataSources",
  "/credentialSubject/dataHash",
  "/credentialSubject/iCRR",
  "/credentialSubject/statuss",
  "/credentialSubject/vCRR"
]
//   [
//   // '/credentialSubject/achievements/1/sails/0',
//   // '/credentialSubject/achievements/1/sails/2',
//   // '/credentialSubject/achievements/1/boards/1',
//   "/issuer",
//   "/credentialSubject/id",
//   "/issuanceDate"

// ]

, {} )

// const cryptosuite = createSignCryptosuite();
// const unsignedCredential = klona( {} );
// const keyPair = await Bls12381Multikey.from( {
//   ...bls12381MultikeyKeyPair
// }, { algorithm } );
// const date = new Date().toISOString()
// const suite = new DataIntegrityProof( {
//   signer: keyPair.signer(), date, cryptosuite
// } );

// console.log(keyPair,suite)
// const accountId = "0.0.4679069"
// const privateKey = PrivateKey.fromStringED25519("883409b71dc4cee7a6deba55f56a209c62ca815ed70631a43a46e57ae15d0ded")
// const client = Client.forTestnet()
// client.setOperator(accountId,privateKey)

// async function main(){
//   const HCSDoc = new HcsDid({client,privateKey})
//   await HCSDoc.register()
//   console.log(HCSDoc.getIdentifier(),(await HCSDoc.resolve()))
// }
// main()