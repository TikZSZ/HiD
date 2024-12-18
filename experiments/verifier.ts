import dataIntegrityContext from '@digitalbazaar/data-integrity-context';
import multikeyContext from '@digitalbazaar/multikey-context';
import { Ed25519PubCodec, HcsDid } from '../src/HiD/did-sdk/index';
import { base58_to_binary, binary_to_base58 } from 'base58-js';
import
{
  createDiscloseCryptosuite,
  createVerifyCryptosuite
} from "@digitalbazaar/bbs-2023-cryptosuite"
import { klona } from 'klona';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import jsigs from 'jsonld-signatures';
import * as vc from '@digitalbazaar/vc';
import { cryptosuite as eddsaRdfc2022CryptoSuite } from
  '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
const { purposes: { AssertionProofPurpose } } = jsigs;
export type JSONValue = string | number | boolean | JSONObject | JSONArray;

const trustedOrgs: string[] = []
function isTrustedUrl(trustedOrgs: string[], urlToCheck: string): boolean {
  return trustedOrgs.some(trustedUrl => {
    // Escape special characters in the trusted URL to use it in a regex
    const escapedUrl = trustedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Build a strict regex: the trusted URL must be the prefix and allow only #, ?, or / after
    const regex = new RegExp(`^${escapedUrl}(?:[#?/].*|$)`);
    return regex.test(urlToCheck);
  });
}
export interface JSONObject
{
  [ x: string ]: JSONValue;
}
interface DIDObj
{
  '@context': string;
  id: string;
  verificationMethod: VerificationMethod[];
  assertionMethod: string[];
  authentication: string[];
}

interface VerificationMethod
{
  id: string;
  type: string;
  controller: string;
  publicKeyBase58: string;
}

export interface JSONArray extends Array<JSONValue> { }
const contexts = new Map<string, JSONObject>();

interface WebControllerDoc
{
  '@context': string[];
  id: string;
  alsoKnownAs: string;
  assertionMethod: AssertionMethod[];
}

interface AssertionMethod
{
  '@context': string;
  type: string;
  controller: string;
  id: string;
  publicKeyMultibase: string;
}

contexts.set( "https://w3id.org/vc/status-list/2021/v1", {
  "@context": {
    "@protected": true,

    StatusList2021Credential: {
      "@id": "https://w3id.org/vc/status-list#StatusList2021Credential",
      "@context": {
        "@protected": true,

        id: "@id",
        type: "@type",

        description: "http://schema.org/description",
        name: "http://schema.org/name"
      }
    },

    StatusList2021: {
      "@id": "https://w3id.org/vc/status-list#StatusList2021",
      "@context": {
        "@protected": true,

        id: "@id",
        type: "@type",

        statusPurpose: "https://w3id.org/vc/status-list#statusPurpose",
        encodedList: "https://w3id.org/vc/status-list#encodedList"
      }
    },

    StatusList2021Entry: {
      "@id": "https://w3id.org/vc/status-list#StatusList2021Entry",
      "@context": {
        "@protected": true,

        id: "@id",
        type: "@type",

        statusPurpose: "https://w3id.org/vc/status-list#statusPurpose",
        statusListIndex: "https://w3id.org/vc/status-list#statusListIndex",
        statusListCredential: {
          "@id": "https://w3id.org/vc/status-list#statusListCredential",
          "@type": "@id"
        }
      }
    }
  }
} );

const dataIntegrityContextURL = dataIntegrityContext.constants.CONTEXT_URL
const multikeyContextContextURL = multikeyContext.constants.CONTEXT_URL

contexts.set( dataIntegrityContextURL, dataIntegrityContext.contexts.get( dataIntegrityContextURL ) )
contexts.set( multikeyContextContextURL, multikeyContext.contexts.get( multikeyContextContextURL ) )

// contexts.set(publicEDDSAMultikeyKey.controller,
//   controllerDocEDD25519Multikey)
// contexts.set(
//   publicEDDSAMultikeyKey.id,
//     publicEDDSAMultikeyKey)
contexts.set( "https://www.w3.org/2018/credentials/v1", {
  "@context": {
    "@version": 1.1,
    "@protected": true,

    id: "@id",
    type: "@type",

    VerifiableCredential: {
      "@id": "https://www.w3.org/2018/credentials#VerifiableCredential",
      "@context": {
        "@version": 1.1,
        "@protected": true,

        id: "@id",
        type: "@type",

        cred: "https://www.w3.org/2018/credentials#",
        sec: "https://w3id.org/security#",
        xsd: "http://www.w3.org/2001/XMLSchema#",

        credentialSchema: {
          "@id": "cred:credentialSchema",
          "@type": "@id",
          "@context": {
            "@version": 1.1,
            "@protected": true,

            id: "@id",
            type: "@type",

            cred: "https://www.w3.org/2018/credentials#",

            JsonSchemaValidator2018: "cred:JsonSchemaValidator2018"
          }
        },
        credentialStatus: { "@id": "cred:credentialStatus", "@type": "@id" },
        credentialSubject: { "@id": "cred:credentialSubject", "@type": "@id" },
        evidence: { "@id": "cred:evidence", "@type": "@id" },
        expirationDate: { "@id": "cred:expirationDate", "@type": "xsd:dateTime" },
        holder: { "@id": "cred:holder", "@type": "@id" },
        issued: { "@id": "cred:issued", "@type": "xsd:dateTime" },
        issuer: { "@id": "cred:issuer", "@type": "@id" },
        issuanceDate: { "@id": "cred:issuanceDate", "@type": "xsd:dateTime" },
        proof: { "@id": "sec:proof", "@type": "@id", "@container": "@graph" },
        refreshService: {
          "@id": "cred:refreshService",
          "@type": "@id",
          "@context": {
            "@version": 1.1,
            "@protected": true,

            id: "@id",
            type: "@type",

            cred: "https://www.w3.org/2018/credentials#",

            ManualRefreshService2018: "cred:ManualRefreshService2018"
          }
        },
        termsOfUse: { "@id": "cred:termsOfUse", "@type": "@id" },
        validFrom: { "@id": "cred:validFrom", "@type": "xsd:dateTime" },
        validUntil: { "@id": "cred:validUntil", "@type": "xsd:dateTime" }
      }
    },

    VerifiablePresentation: {
      "@id": "https://www.w3.org/2018/credentials#VerifiablePresentation",
      "@context": {
        "@version": 1.1,
        "@protected": true,

        id: "@id",
        type: "@type",

        cred: "https://www.w3.org/2018/credentials#",
        sec: "https://w3id.org/security#",

        holder: { "@id": "cred:holder", "@type": "@id" },
        proof: { "@id": "sec:proof", "@type": "@id", "@container": "@graph" },
        verifiableCredential: { "@id": "cred:verifiableCredential", "@type": "@id", "@container": "@graph" }
      }
    },

    EcdsaSecp256k1Signature2019: {
      "@id": "https://w3id.org/security#EcdsaSecp256k1Signature2019",
      "@context": {
        "@version": 1.1,
        "@protected": true,

        id: "@id",
        type: "@type",

        sec: "https://w3id.org/security#",
        xsd: "http://www.w3.org/2001/XMLSchema#",

        challenge: "sec:challenge",
        created: { "@id": "http://purl.org/dc/terms/created", "@type": "xsd:dateTime" },
        domain: "sec:domain",
        expires: { "@id": "sec:expiration", "@type": "xsd:dateTime" },
        jws: "sec:jws",
        nonce: "sec:nonce",
        proofPurpose: {
          "@id": "sec:proofPurpose",
          "@type": "@vocab",
          "@context": {
            "@version": 1.1,
            "@protected": true,

            id: "@id",
            type: "@type",

            sec: "https://w3id.org/security#",

            assertionMethod: { "@id": "sec:assertionMethod", "@type": "@id", "@container": "@set" },
            authentication: { "@id": "sec:authenticationMethod", "@type": "@id", "@container": "@set" }
          }
        },
        proofValue: "sec:proofValue",
        verificationMethod: { "@id": "sec:verificationMethod", "@type": "@id" }
      }
    },

    EcdsaSecp256r1Signature2019: {
      "@id": "https://w3id.org/security#EcdsaSecp256r1Signature2019",
      "@context": {
        "@version": 1.1,
        "@protected": true,

        id: "@id",
        type: "@type",

        sec: "https://w3id.org/security#",
        xsd: "http://www.w3.org/2001/XMLSchema#",

        challenge: "sec:challenge",
        created: { "@id": "http://purl.org/dc/terms/created", "@type": "xsd:dateTime" },
        domain: "sec:domain",
        expires: { "@id": "sec:expiration", "@type": "xsd:dateTime" },
        jws: "sec:jws",
        nonce: "sec:nonce",
        proofPurpose: {
          "@id": "sec:proofPurpose",
          "@type": "@vocab",
          "@context": {
            "@version": 1.1,
            "@protected": true,

            id: "@id",
            type: "@type",

            sec: "https://w3id.org/security#",

            assertionMethod: { "@id": "sec:assertionMethod", "@type": "@id", "@container": "@set" },
            authentication: { "@id": "sec:authenticationMethod", "@type": "@id", "@container": "@set" }
          }
        },
        proofValue: "sec:proofValue",
        verificationMethod: { "@id": "sec:verificationMethod", "@type": "@id" }
      }
    },

    Ed25519Signature2018: {
      "@id": "https://w3id.org/security#Ed25519Signature2018",
      "@context": {
        "@version": 1.1,
        "@protected": true,

        id: "@id",
        type: "@type",

        sec: "https://w3id.org/security#",
        xsd: "http://www.w3.org/2001/XMLSchema#",

        challenge: "sec:challenge",
        created: { "@id": "http://purl.org/dc/terms/created", "@type": "xsd:dateTime" },
        domain: "sec:domain",
        expires: { "@id": "sec:expiration", "@type": "xsd:dateTime" },
        jws: "sec:jws",
        nonce: "sec:nonce",
        proofPurpose: {
          "@id": "sec:proofPurpose",
          "@type": "@vocab",
          "@context": {
            "@version": 1.1,
            "@protected": true,

            id: "@id",
            type: "@type",

            sec: "https://w3id.org/security#",

            assertionMethod: { "@id": "sec:assertionMethod", "@type": "@id", "@container": "@set" },
            authentication: { "@id": "sec:authenticationMethod", "@type": "@id", "@container": "@set" }
          }
        },
        proofValue: "sec:proofValue",
        verificationMethod: { "@id": "sec:verificationMethod", "@type": "@id" }
      }
    },

    RsaSignature2018: {
      "@id": "https://w3id.org/security#RsaSignature2018",
      "@context": {
        "@version": 1.1,
        "@protected": true,

        challenge: "sec:challenge",
        created: { "@id": "http://purl.org/dc/terms/created", "@type": "xsd:dateTime" },
        domain: "sec:domain",
        expires: { "@id": "sec:expiration", "@type": "xsd:dateTime" },
        jws: "sec:jws",
        nonce: "sec:nonce",
        proofPurpose: {
          "@id": "sec:proofPurpose",
          "@type": "@vocab",
          "@context": {
            "@version": 1.1,
            "@protected": true,

            id: "@id",
            type: "@type",

            sec: "https://w3id.org/security#",

            assertionMethod: { "@id": "sec:assertionMethod", "@type": "@id", "@container": "@set" },
            authentication: { "@id": "sec:authenticationMethod", "@type": "@id", "@container": "@set" }
          }
        },
        proofValue: "sec:proofValue",
        verificationMethod: { "@id": "sec:verificationMethod", "@type": "@id" }
      }
    },

    proof: { "@id": "https://w3id.org/security#proof", "@type": "@id", "@container": "@graph" }
  }
} );
contexts.set( 'https://www.w3.org/ns/credentials/v2', {
  "@context": {
    "@protected": true,
    "@vocab": "https://www.w3.org/ns/credentials/issuer-dependent#",

    "id": "@id",
    "type": "@type",

    "kid": {
      "@id": "https://www.iana.org/assignments/jose#kid",
      "@type": "@id"
    },
    "iss": {
      "@id": "https://www.iana.org/assignments/jose#iss",
      "@type": "@id"
    },
    "sub": {
      "@id": "https://www.iana.org/assignments/jose#sub",
      "@type": "@id"
    },
    "jku": {
      "@id": "https://www.iana.org/assignments/jose#jku",
      "@type": "@id"
    },
    "x5u": {
      "@id": "https://www.iana.org/assignments/jose#x5u",
      "@type": "@id"
    },
    "aud": {
      "@id": "https://www.iana.org/assignments/jwt#aud",
      "@type": "@id"
    },
    "exp": {
      "@id": "https://www.iana.org/assignments/jwt#exp",
      "@type": "https://www.w3.org/2001/XMLSchema#nonNegativeInteger"
    },
    "nbf": {
      "@id": "https://www.iana.org/assignments/jwt#nbf",
      "@type": "https://www.w3.org/2001/XMLSchema#nonNegativeInteger"
    },
    "iat": {
      "@id": "https://www.iana.org/assignments/jwt#iat",
      "@type": "https://www.w3.org/2001/XMLSchema#nonNegativeInteger"
    },
    "cnf": {
      "@id": "https://www.iana.org/assignments/jwt#cnf",
      "@context": {
        "@protected": true,
        "kid": {
          "@id": "https://www.iana.org/assignments/jwt#kid",
          "@type": "@id"
        },
        "jwk": {
          "@id": "https://www.iana.org/assignments/jwt#jwk",
          "@type": "@json"
        }
      }
    },
    "_sd_alg": {
      "@id": "https://www.iana.org/assignments/jwt#_sd_alg"
    },
    "_sd": {
      "@id": "https://www.iana.org/assignments/jwt#_sd"
    },
    "...": {
      "@id": "https://www.iana.org/assignments/jwt#..."
    },

    "digestSRI": {
      "@id": "https://www.w3.org/2018/credentials#digestSRI",
      "@type": "https://www.w3.org/2018/credentials#sriString"
    },
    "digestMultibase": {
      "@id": "https://w3id.org/security#digestMultibase",
      "@type": "https://w3id.org/security#multibase"
    },

    "mediaType": {
      "@id": "https://schema.org/encodingFormat"
    },

    "description": "https://schema.org/description",
    "name": "https://schema.org/name",

    "EnvelopedVerifiableCredential":
      "https://www.w3.org/2018/credentials#EnvelopedVerifiableCredential",

    "VerifiableCredential": {
      "@id": "https://www.w3.org/2018/credentials#VerifiableCredential",
      "@context": {
        "@protected": true,

        "id": "@id",
        "type": "@type",

        "credentialSchema": {
          "@id": "https://www.w3.org/2018/credentials#credentialSchema",
          "@type": "@id"
        },
        "credentialStatus": {
          "@id": "https://www.w3.org/2018/credentials#credentialStatus",
          "@type": "@id"
        },
        "credentialSubject": {
          "@id": "https://www.w3.org/2018/credentials#credentialSubject",
          "@type": "@id"
        },
        "description": "https://schema.org/description",
        "evidence": {
          "@id": "https://www.w3.org/2018/credentials#evidence",
          "@type": "@id"
        },
        "validFrom": {
          "@id": "https://www.w3.org/2018/credentials#validFrom",
          "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
        },
        "validUntil": {
          "@id": "https://www.w3.org/2018/credentials#validUntil",
          "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
        },
        "issuer": {
          "@id": "https://www.w3.org/2018/credentials#issuer",
          "@type": "@id"
        },
        "name": "https://schema.org/name",
        "proof": {
          "@id": "https://w3id.org/security#proof",
          "@type": "@id",
          "@container": "@graph"
        },
        "refreshService": {
          "@id": "https://www.w3.org/2018/credentials#refreshService",
          "@type": "@id"
        },
        "termsOfUse": {
          "@id": "https://www.w3.org/2018/credentials#termsOfUse",
          "@type": "@id"
        },
        "confidenceMethod": {
          "@id": "https://www.w3.org/2018/credentials#confidenceMethod",
          "@type": "@id"
        },
        "relatedResource": {
          "@id": "https://www.w3.org/2018/credentials#relatedResource",
          "@type": "@id"
        }
      }
    },

    "VerifiablePresentation": {
      "@id": "https://www.w3.org/2018/credentials#VerifiablePresentation",
      "@context": {
        "@protected": true,

        "id": "@id",
        "type": "@type",
        "holder": {
          "@id": "https://www.w3.org/2018/credentials#holder",
          "@type": "@id"
        },
        "proof": {
          "@id": "https://w3id.org/security#proof",
          "@type": "@id",
          "@container": "@graph"
        },
        "verifiableCredential": {
          "@id": "https://www.w3.org/2018/credentials#verifiableCredential",
          "@type": "@id",
          "@container": "@graph",
          "@context": null
        },
        "termsOfUse": {
          "@id": "https://www.w3.org/2018/credentials#termsOfUse",
          "@type": "@id"
        }
      }
    },

    "JsonSchemaCredential": "https://w3.org/2018/credentials#JsonSchemaCredential",

    "JsonSchema": {
      "@id": "https://w3.org/2018/credentials#JsonSchema",
      "@context": {
        "@protected": true,

        "id": "@id",
        "type": "@type",

        "jsonSchema": {
          "@id": "https://w3.org/2018/credentials#jsonSchema",
          "@type": "@json"
        }
      }
    },

    "BitstringStatusListCredential": "https://www.w3.org/ns/credentials/status#BitstringStatusListCredential",

    "BitstringStatusList": {
      "@id": "https://www.w3.org/ns/credentials/status#BitstringStatusList",
      "@context": {
        "@protected": true,

        "id": "@id",
        "type": "@type",

        "statusPurpose":
          "https://www.w3.org/ns/credentials/status#statusPurpose",
        "encodedList":
          "https://www.w3.org/ns/credentials/status#encodedList",
        "ttl": "https://www.w3.org/ns/credentials/status#ttl",
        "statusReference": "https://www.w3.org/ns/credentials/status#statusReference",
        "statusSize": "https://www.w3.org/ns/credentials/status#statusSize",
        "statusMessage": {
          "@id": "https://www.w3.org/ns/credentials/status#statusMessage",
          "@context": {
            "@protected": true,

            "id": "@id",
            "type": "@type",

            "status": "https://www.w3.org/ns/credentials/status#status",
            "message": "https://www.w3.org/ns/credentials/status#message"
          }
        }
      }
    },

    "BitstringStatusListEntry": {
      "@id":
        "https://www.w3.org/ns/credentials/status#BitstringStatusListEntry",
      "@context": {
        "@protected": true,

        "id": "@id",
        "type": "@type",

        "statusPurpose":
          "https://www.w3.org/ns/credentials/status#statusPurpose",
        "statusListIndex":
          "https://www.w3.org/ns/credentials/status#statusListIndex",
        "statusListCredential": {
          "@id":
            "https://www.w3.org/ns/credentials/status#statusListCredential",
          "@type": "@id"
        }
      }
    },

    "DataIntegrityProof": {
      "@id": "https://w3id.org/security#DataIntegrityProof",
      "@context": {
        "@protected": true,
        "id": "@id",
        "type": "@type",
        "challenge": "https://w3id.org/security#challenge",
        "created": {
          "@id": "http://purl.org/dc/terms/created",
          "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
        },
        "domain": "https://w3id.org/security#domain",
        "expires": {
          "@id": "https://w3id.org/security#expiration",
          "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
        },
        "nonce": "https://w3id.org/security#nonce",
        "previousProof": {
          "@id": "https://w3id.org/security#previousProof",
          "@type": "@id"
        },
        "proofPurpose": {
          "@id": "https://w3id.org/security#proofPurpose",
          "@type": "@vocab",
          "@context": {
            "@protected": true,
            "id": "@id",
            "type": "@type",
            "assertionMethod": {
              "@id": "https://w3id.org/security#assertionMethod",
              "@type": "@id",
              "@container": "@set"
            },
            "authentication": {
              "@id": "https://w3id.org/security#authenticationMethod",
              "@type": "@id",
              "@container": "@set"
            },
            "capabilityInvocation": {
              "@id": "https://w3id.org/security#capabilityInvocationMethod",
              "@type": "@id",
              "@container": "@set"
            },
            "capabilityDelegation": {
              "@id": "https://w3id.org/security#capabilityDelegationMethod",
              "@type": "@id",
              "@container": "@set"
            },
            "keyAgreement": {
              "@id": "https://w3id.org/security#keyAgreementMethod",
              "@type": "@id",
              "@container": "@set"
            }
          }
        },
        "cryptosuite": {
          "@id": "https://w3id.org/security#cryptosuite",
          "@type": "https://w3id.org/security#cryptosuiteString"
        },
        "proofValue": {
          "@id": "https://w3id.org/security#proofValue",
          "@type": "https://w3id.org/security#multibase"
        },
        "verificationMethod": {
          "@id": "https://w3id.org/security#verificationMethod",
          "@type": "@id"
        }
      }
    }
  }
} )
contexts.set( 'https://www.w3.org/ns/credentials/examples/v2', {
  /* eslint-disable */
  "@context": {
    "@vocab": "https://www.w3.org/ns/credentials/examples#"
  }
  /* eslint-enable */
} )


export async function documentLoader ( url: string )
{
  if ( contexts.has( url ) )
  {
    return {
      document: contexts.get( url )
    };
  }
  const [ protocol, method ] = url.split( ":" )
  if ( protocol === "did" )
  {
    switch ( method )
    {
      case "hedera":
        const [ did, _ ] = url.split( "#" )
        const didDocument = ( await new HcsDid( { identifier: did } ).resolve() ).toJsonTree() as DIDObj
        if ( !didDocument.id && didDocument.verificationMethod.length < 1 )
        {
          console.log( "no did found" )
          return {}
        }
        // console.log( didDocument )
        const controller = didDocument.id
        try
        {
          const securityMethods = [ "assertionMethod", "authentication", "capabilityDelegation", "capabilityInvocation" ]
          const allMultiKeys: { [ key: string ]: object[] } = {}
          for ( const securityMethod of securityMethods )
          {
            if ( didDocument[ securityMethod ] && didDocument[ securityMethod ].length > 0 )
            {
              const keyIds = didDocument[ securityMethod ] as string[]
              for ( const keyId of keyIds )
              {
                const keyDocs = didDocument.verificationMethod.map( ( verMethod ) =>
                {
                  if ( verMethod.id === keyId ) return {
                    '@context': 'https://w3id.org/security/multikey/v1',
                    type: 'Multikey',
                    controller,
                    id: verMethod.id,
                    publicKeyMultibase: "z" + binary_to_base58( new Ed25519PubCodec().encode( base58_to_binary( verMethod.publicKeyBase58 ) ) )
                  }
                } )
                if ( keyDocs.length > 0 )
                {
                  // @ts-ignore
                  allMultiKeys[ securityMethod ] = keyDocs
                }
              }
            }
          }

          const controllerDocEDDSAMultikey = {
            '@context': [
              'https://www.w3.org/ns/did/v1',
              'https://w3id.org/security/multikey/v1'
            ],
            id: controller,
            ...allMultiKeys
          };
          console.log( "\n=== DID Document Fetched for " + did + " ===\n" )
          console.log( controllerDocEDDSAMultikey )
          contexts.set( controllerDocEDDSAMultikey.id, controllerDocEDDSAMultikey )
          for ( let key in allMultiKeys )
          {
            allMultiKeys[ key ].map( ( keyDOc ) =>
            {
              contexts.set( keyDOc.id, keyDOc )
            } )
          }
        } catch ( err )
        {
          console.log( err )
        }
        return { document: contexts.get( url ) }

      case "key": {
        const keyParts = url.split( ":" );
        console.log( keyParts )
        const base58PublicKey = keyParts[ 2 ];

        if ( !base58PublicKey )
        {
          throw new Error( "Invalid did:key format" );
        }

        const publicKeyMultibase = "z" + base58PublicKey;
        const didKeyDoc = {
          "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/multikey/v1",
          ],
          id: url,
          verificationMethod: [
            {
              id: `${url}#${base58PublicKey}`,
              type: "Multikey",
              controller: url,
              publicKeyMultibase,
            },
          ],
          assertionMethod: [ `${url}#${base58PublicKey}` ],
        };

        contexts.set( url, didKeyDoc );
        return {
          document: didKeyDoc,
        };
      }

      case "web": {
        console.log( "Fetching web documents" )
        let didUrl = url.split( "did:web:" )[ 1 ]
        if ( didUrl.startsWith( "https" ) || didUrl.startsWith( "http" ) )
        {
          didUrl = didUrl.replace( "https://", "" ).replace( "http://", "" )
        }

        if (!isTrustedUrl( trustedOrgs, url ) )
        {
          console.log( "Untrusted Org Detected aborting verification",trustedOrgs, didUrl )
          
          return {document:null}
        }
        const response = await fetch( `https://${didUrl}` );
        if ( !response.ok )
        {
          throw new Error( `Failed to fetch DID document from ${didUrl}` );
        }

        const didWebDoc = await response.json() as WebControllerDoc
        contexts.set( didWebDoc.id, didWebDoc )
        didWebDoc.assertionMethod.map( ( assertMeth ) =>
        {
          contexts.set( assertMeth.id, assertMeth )
        } )
        if ( !didWebDoc || !didWebDoc.id )
        {
          throw new Error( "Invalid DID document fetched from web" );
        }
        console.log( "=== DID Document Fetched For " + url + " ===\n" )
        console.log( didWebDoc )
        return {
          document: contexts.get( url ),
        };
      }

      default: {
        throw new Error( `Unsupported DID method: ${method}` );
      }
    }
  }
  console.log( url )
}


async function main ()
{
  try
  {
    // note that the Trusted Org isnt for who the certificate was issued to but rather who issued the certificate meaning "issuer"
    trustedOrgs.push( "did:web:675d93dc69da7be75efd.appwrite.global/issuers/6761539b002297cdce52","did:web:675d93dc69da7be75efd.appwrite.global/issuers/6761a5ae001d1f018cd1" )

    // const vpURL = "https://cloud.appwrite.io/v1/storage/buckets/675369170001613e4498/files/6761b26c000d6e65b6fd/view?project=674ff4ff003453a735a9"

    const vpURL = "https://cloud.appwrite.io/v1/storage/buckets/675369170001613e4498/files/6762924400259dab2b73/view?project=674ff4ff003453a735a9"

    const vpData: { presentation: any } = await ( await fetch( vpURL ) ).json() as any
    if ( !vpData.presentation ) throw new Error( "VP not found" )

    const {presentation} = vpData
    
    // setup crypto suites and verfier
    const cryptosuite = createVerifyCryptosuite();
    const suite = new DataIntegrityProof( { cryptosuite: cryptosuite } );
    const suite2 = new DataIntegrityProof( { cryptosuite: eddsaRdfc2022CryptoSuite } );

    // verify the VP 
    const result = await vc.verify( {
      presentation: presentation,
      suite: [ suite, suite2 ],
      documentLoader,
      presentationPurpose: new AssertionProofPurpose()
    } );
    console.log( "===VP Verified succesfully===\n\n", result.verified )
  } catch ( error )
  {
    console.log( error )
  }
}

main()