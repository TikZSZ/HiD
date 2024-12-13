
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
import {HcsDid} from "../src/HiD/did-sdk/index"
import { Client, PrivateKey, Signer } from "@hashgraph/sdk";
const documentLoader = loader.build();

const cryptosuite = createSignCryptosuite();
const unsignedCredential = klona( {} );
const keyPair = await Bls12381Multikey.from( {
  ...bls12381MultikeyKeyPair
}, { algorithm } );
const date = new Date().toISOString()
const suite = new DataIntegrityProof( {
  signer: keyPair.signer(), date, cryptosuite
} );

console.log(keyPair,suite)
const accountId = "0.0.4679069"
const privateKey = PrivateKey.fromStringED25519("883409b71dc4cee7a6deba55f56a209c62ca815ed70631a43a46e57ae15d0ded")
const client = Client.forTestnet()
client.setOperator(accountId,privateKey)
async function main(){
  const HCSDoc = new HcsDid({client,privateKey})
  await HCSDoc.register()
  console.log(HCSDoc.getIdentifier(),(await HCSDoc.resolve()))
}
main()