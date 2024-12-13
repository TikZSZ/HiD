
import
  {
    createDiscloseCryptosuite,
    createSignCryptosuite,
    createVerifyCryptosuite
  } from "@digitalbazaar/bbs-2023-cryptosuite"
import * as Bls12381Multikey from "@digitalbazaar/bls12-381-multikey"
import
  {
    alumniCredential,
    bls12381MultikeyKeyPair,
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
    signer: keyPair.signer(), date, cryptosuite
  } );

  let error;
  let signedCredential;
  try
  {
    signedCredential = await jsigs.sign( unsignedCredential, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    } );
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
      revealed = await jsigs.derive( signedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      } );
    } catch ( e )
    {
      error = e;
    }
    console.dir( { error, revealed: { ...revealed, ...nullObj } }, { depth: null } )
  }
  await reveal()
  console.log( "\n =========\n", 'should verify a document', "\n =========" )

  async function verify(){
    const cryptosuite = createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const signedCredentialCopy = klona(revealed);
    const result = await jsigs.verify(signedCredentialCopy, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });
    console.dir(result.verified,{depth:null})
  }
  verify()
}

// main(dlCredential,[
//   '/credentialSubject/driverLicense/dateOfBirth',
//   '/credentialSubject/driverLicense/expirationDate'
// ],{proof:null,"@context":null})

main( achievementCredential, [
  '/credentialSubject/achievements/1/sails/0',
  '/credentialSubject/achievements/1/sails/2',
  '/credentialSubject/achievements/1/boards/1',
  "/type",
  "/issuer",
  "/@context"

], { proof: null, "@context": null } )
