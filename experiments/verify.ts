/*!
 * Copyright (c) 2023-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as bbs2023Cryptosuite from '@digitalbazaar/bbs-2023-cryptosuite';
import * as Bls12381Multikey from '@digitalbazaar/bls12-381-multikey';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import jsigs from 'jsonld-signatures';
import {loader} from './documentLoader.js';

import * as testVectors from './test-vectors.js';

const {
  createDiscloseCryptosuite,
  createVerifyCryptosuite
} = bbs2023Cryptosuite;

const algorithm = Bls12381Multikey.ALGORITHMS.BBS_BLS12381_SHA256;

const {purposes: {AssertionProofPurpose}} = jsigs;

const documentLoader = loader.build();

async function main(){
  const {keyMaterial} = testVectors;
  const keyPair = await Bls12381Multikey.fromRaw({
    algorithm,
    secretKey: h2b(keyMaterial.privateKeyHex),
    publicKey: h2b(keyMaterial.publicKeyHex)
  });
  keyPair.controller = `did:key:${keyPair.publicKeyMultibase}`;
  keyPair.id = `${keyPair.controller}#${keyPair.publicKeyMultibase}`;

  const {signedSDBase} = testVectors;

    // generate reveal doc
    const discloseCryptosuite = createDiscloseCryptosuite({
      selectivePointers: [
        '/credentialSubject/boards/0'
      ] as any,
      
    }); 

    let error;
    let revealed;
    try {
      revealed = await jsigs.derive(signedSDBase, {
        suite: new DataIntegrityProof({cryptosuite: discloseCryptosuite}),
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    } catch(e) {
      error = e;
    }
    console.dir({error,revealed},{depth:Infinity})
}

main()
// hex => bytes
function h2b(hex) {
  if(hex.length === 0) {
    return new Uint8Array();
  }
  return Uint8Array.from(hex.match(/.{1,2}/g).map(h => parseInt(h, 16)));
}