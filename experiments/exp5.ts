
import
{
  createDiscloseCryptosuite,
  createSignCryptosuite,
  createVerifyCryptosuite,
} from "@digitalbazaar/bbs-2023-cryptosuite"
import * as Bls12381Multikey from "@digitalbazaar/bls12-381-multikey"
import * as ECDSAMultikey from "@digitalbazaar/ecdsa-multikey"
import { createSignCryptosuite as ECDSACreateSignCryptosuite, createVerifyCryptosuite as ECDSACreateVerifyCryptosuite } from "@digitalbazaar/ecdsa-sd-2023-cryptosuite"
import {cryptosuite as ecdsaRdfc2019Cryptosuite} from
  '@digitalbazaar/ecdsa-rdfc-2019-cryptosuite';
import
{
  alumniCredential,
  bls12381MultikeyKeyPair,
  publicECDSAMultikeyKeyPair,
  dlCredential,
  dlCredentialNoIds,
  achievementCredential
} from './mock-data';
import * as vc from '@digitalbazaar/vc';

const algorithm = Bls12381Multikey.ALGORITHMS.BBS_BLS12381_SHA256;
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import jsigs from 'jsonld-signatures';
import { klona } from 'klona';
import { loader } from "./documentLoader"
import { toRDF } from "jsonld"
import { canonize } from "rdf-canonize"
const { purposes: { AssertionProofPurpose } } = jsigs;

const documentLoader = loader.build();

async function main ( credential: object, selectivePointers: string[], nullObj: object = {} )
{
  const cryptosuite = createSignCryptosuite();
  const unsignedCredential = klona( credential );
  const keyPair = await Bls12381Multikey.from( {
    ...bls12381MultikeyKeyPair
  }, { algorithm } );
  const date = new Date().toISOString()
  const suite = new DataIntegrityProof( {
    signer: keyPair.signer(), cryptosuite
  } );

  let error;
  let signedCredential;
  try
  {
    signedCredential = await vc.issue( { credential: unsignedCredential, suite: suite, documentLoader: documentLoader } )
  } catch ( e )
  {
    error = e;
  }
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

    try
    {
      // revealed = await jsigs.derive( signedCredential, {
      //   suite,
      //   purpose: new AssertionProofPurpose(),
      //   documentLoader
      // } );
      revealed = await vc.derive( { verifiableCredential: signedCredential, suite: suite, documentLoader: documentLoader } )
    } catch ( e )
    {
      error = e;
    }
    console.dir( { error, revealed: { ...revealed, ...nullObj } }, { depth: null } )
  }
  await reveal()
  console.log( "\n =========\n", 'should verify a document', "\n =========" )

  async function verify ()
  {
    const cryptosuite = createVerifyCryptosuite();
    const suite = new DataIntegrityProof( { cryptosuite } );
    const signedCredentialCopy = klona( revealed );
    // const result = await vc.verifyCredential( {
    //   credential: signedCredentialCopy,
    //   suite, documentLoader: documentLoader,
    //   // purpose: new AssertionProofPurpose()
    // } );
    // const signCryptosuite = createSignCryptosuite();
    // const signSuite = new DataIntegrityProof( {
    //   signer: keyPair.signer(), cryptosuite:signCryptosuite
    // } );
    // // const signedDoc = await jsigs.sign( unsignedCredential, {
    // //   suite: signSuite, purpose: new AssertionProofPurpose(),
    // //   documentLoader
    // // } )
    // const signedDoc = await jsigs.sign( unsignedCredential, {
    //       suite:signSuite,
    //       purpose: new AssertionProofPurpose(),
    //       documentLoader
    // } );
    
    const result = await jsigs.verify(
      signedCredentialCopy, {
        suite, purpose: new AssertionProofPurpose(),
      documentLoader
    } );

    // console.dir(result,{depth:null})
    console.log( result.verified )
  }
  await verify()
  let vp;
  let presentation;
  const challenge = '12ec21'

  console.log( "\n =========\n", 'should issue a VP', "\n =========" )
  async function issueVP ()
  {
    const keyPair = await ECDSAMultikey.from( {
      ...publicECDSAMultikeyKeyPair
    } );
    // const cryptosuite = ecdsaRdfc2019Cryptosuite()
    const suite = new DataIntegrityProof( {
      signer: keyPair.signer(), cryptosuite:ecdsaRdfc2019Cryptosuite
    } );
    const id = bls12381MultikeyKeyPair.id;
    const holder = bls12381MultikeyKeyPair.controller;
    presentation = vc.createPresentation( {
      verifiableCredential: revealed, holder: "did:hedera", id: "did:hedera"
    } );
    let rdf = await toRDF( presentation )
    // console.log((await canonize(rdf,{ algorithm: 'RDFC-1.0', })))
    vp = await vc.signPresentation( {
      presentation, suite, documentLoader, challenge, purpose: new AssertionProofPurpose()
    } );
    console.dir( { error, vp: { ...vp, ...nullObj } }, { depth: null } )

    // rdf = await toRDF(vp)
    // console.log((await canonize(rdf,{ algorithm: 'RDFC-1.0', })))
    // console.log(JSON.stringify(vp))
    // console.log( vp )
    // console.log( presentation )
    // const vpDoc:object = {"@context":[ "https://www.w3.org/ns/credentials/v2", "https://www.w3.org/ns/credentials/examples/v2" ],type:["VerifiablePresentation"],verifiableCredential:signedCredential,id:id,holder:holder}
    // console.log(vpDoc)

    // vp = await jsigs.sign( presentation, {
    //   suite,
    //   purpose: new AssertionProofPurpose(),
    //   documentLoader
    // } );
    // console.log( vp )
  }
  await issueVP()

  console.log( "\n =========\n", 'should verify a VP', "\n =========" )
  async function verifyVP ()
  {
    // const cryptosuite2 = ECDSACreateVerifyCryptosuite()
    // const suite2 = new DataIntegrityProof( {
    //   cryptosuite: cryptosuite2
    // } );
    const cryptosuite = createVerifyCryptosuite();
    const suite = new DataIntegrityProof( { cryptosuite:ecdsaRdfc2019Cryptosuite } );
    const suite2 = new DataIntegrityProof( { cryptosuite:createVerifyCryptosuite() } );
    const result = await vc.verify( { presentation: vp, challenge, suite: [suite,suite2], documentLoader, presentationPurpose: new AssertionProofPurpose() } );
    // console.dir( result,{depth:null} )

    // const result = await jsigs.verify( vp, {
    //   suite,
    //   purpose: new AssertionProofPurpose(),
    //   documentLoader,
    // } );

    // const result = await vc.verify( { presentation: vp, suite, presentationPurpose: new AssertionProofPurpose() } )
    // console.log( result.verified )
  }
  await verifyVP()
}

// main(dlCredential,[
//   '/credentialSubject/driverLicense/dateOfBirth',
//   '/credentialSubject/driverLicense/expirationDate'
// ],{proof:null,"@context":null})

main( alumniCredential, [
  // '/credentialSubject/achievements/1/sails/0',
  // '/credentialSubject/achievements/1/sails/2',
  // '/credentialSubject/achievements/1/boards/1',
  "/issuer",
  "/credentialSubject/id",
  "/issuanceDate"

], {} )
