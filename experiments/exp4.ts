import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import {createSignCryptosuite,createConfirmCryptosuite,createVerifyCryptosuite,createDiscloseCryptosuite} from
  '@digitalbazaar/ecdsa-sd-2023-cryptosuite';

import * as vc from '@digitalbazaar/vc';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import { loader } from './documentLoader';
const controller = 'https://example.edu/issuers/565049'
const keyId = 'https://example.edu/issuers/keys/2'
const ecdsaKeyPair = await EcdsaMultikey.generate({
  curve: 'P-256',
  id: 'https://example.edu/issuers/keys/2',
  controller: 'https://example.edu/issuers/565049'
});
// const controllerDoc = {
//   "@context": "https://w3id.org/security/v2",
//   "id": "https://example.edu/issuers/565049",
//   "controller": "https://example.edu/issuers/565049",
//   assertionMethod: [],
//   authentication: []
// }
// controllerDoc.assertionMethod.push(ecdsaKeyPair.id);
// controllerDoc.authentication.push(ecdsaKeyPair.id);
// console.log(controllerDoc)
export const publicBls12381Multikey = {
  '@context': 'https://w3id.org/security/multikey/v1',
  type: 'Multikey',
  controller,
  id: keyId,
  publicKeyMultibase:ecdsaKeyPair.publicKeyMultibase
};

export const bls12381MultikeyKeyPair = {
  '@context': 'https://w3id.org/security/multikey/v1',
  type: 'Multikey',
  controller,
  id: keyId,
  publicKeyMultibase:ecdsaKeyPair.publicKeyMultibase,
  secretKeyMultibase:ecdsaKeyPair.publicKeyMultibase
};

export const controllerDocBls12381Multikey = {
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/multikey/v1'
  ],
  id: controller,
  assertionMethod: [publicBls12381Multikey]
};
// loader.addStatic('https://example.edu/issuers/565049',controllerDoc)
// loader.addStatic('https://example.edu/issuers/keys/1',await ecdsaKeyPair.export({publicKey: true}))
loader.addStatic(
  bls12381MultikeyKeyPair.controller,
  controllerDocBls12381Multikey);
loader.addStatic(
  publicBls12381Multikey.id,
  publicBls12381Multikey);
const documentLoader = loader.build()
console.log(ecdsaKeyPair)
// sample exported key pair
/*
{
  "@context": "https://w3id.org/security/multikey/v1",
  "id": "https://example.edu/issuers/keys/2",
  "type": "Multikey",
  "controller": "https://example.edu/issuers/565049",
  "publicKeyMultibase": "zDnaeWJjGpXnQAbEpRur3kSWFapGZbwGnFCkzyhiq7nDeXXrM",
  "secretKeyMultibase": "z42trzSpncjWFaB9cKE2Gg5hxtbuAQa5mVJgGwjrugHMacdM"
}
*/

// sample unsigned credential
const credential = {
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://www.w3.org/ns/credentials/examples/v2"
  ],
  "id": "https://example.com/credentials/1872",
  "type": ["VerifiableCredential", "AlumniCredential"],
  "issuer": "https://example.edu/issuers/565049",
  "issuanceDate": "2010-01-01T19:23:24Z",
  "credentialSubject": {
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "alumniOf": "Example University"
  }
};

// setup ecdsa-sd-2023 suite for signing selective disclosure VCs
const suite = new DataIntegrityProof({
  signer: ecdsaKeyPair.signer(),
  cryptosuite: createSignCryptosuite({
    // require the `issuer` and `issuanceDate` fields to always be disclosed
    // by the holder (presenter)
    mandatoryPointers: [
      '/issuanceDate',
      '/issuer'
    ]
  })
});
// use a proof ID to enable it to be found and transformed into a disclosure
// proof by the holder later
const proofId = `urn:uuid:${crypto.randomUUID()}`;
suite.proof = {id: proofId};

const signedVC = await vc.issue({credential, suite, documentLoader,});
console.log(JSON.stringify(signedVC, null, 2));
let derivedVC
await (async ()=>{
  const suite = new DataIntegrityProof({
    cryptosuite: createDiscloseCryptosuite({
      // the ID of the base proof to convert to a disclosure proof
      // proofId: 'urn:uuid:da088899-3439-41ea-a580-af3f1cf98cd3',
      // selectively disclose the entire credential subject; different JSON
      // pointers could be provided to selectively disclose different information;
      // the issuer will have mandatory fields that will be automatically
      // disclosed such as the `issuer` and `issuanceDate` fields
      selectivePointers: [
        '/credentialSubject/id'
      ]
    })
  });
  
  derivedVC = await vc.derive({
    verifiableCredential:signedVC, suite, documentLoader
  });
  console.log(JSON.stringify(derivedVC, null, 2));
})()

const id = 'ebc6f1c2';
const holder = 'did:example:ebfeb1f712ebc6f1c276e12ec21';

const presentation = vc.createPresentation({
  verifiableCredential:derivedVC, id, holder,
});
console.log(presentation)

const vp = await vc.signPresentation({
  presentation, suite, documentLoader,challenge:'12ec21'
});