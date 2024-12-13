import * as ed25519 from "@noble/ed25519";
import * as jsonld from "jsonld";
import canonize from "rdf-canonize";
import { binary_to_base58, base58_to_binary } from "base58-js";
import { createHash } from "crypto";
const base58btc = {
  encode: binary_to_base58,
  decode: base58_to_binary
}
function sha256 ( input: Buffer )
{
  const hash = createHash( "sha256" )
  hash.update( input )
  return hash.digest()
}
type Proof = {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  cryptosuite: string;
  proofValue?: string;
};

class EdDsaRdfc2022
{
  // Create a proof for a given document
  public async createProof (
    unsecuredDocument: Record<string, any>,
    proofOptions: Proof,
    privateKey: Uint8Array
  ): Promise<Proof>
  {
    // Clone the proof options
    const proof: Proof = { ...proofOptions };

    // 1. Proof Configuration
    const canonicalProofConfig = await this.getProofConfiguration(
      unsecuredDocument,
      proofOptions
    );

    // 2. Transformation
    const transformedData = await this.transformDocument(
      unsecuredDocument,
      proofOptions
    );

    // 3. Hashing
    const hashData = this.hashData( transformedData, canonicalProofConfig );

    // 4. Proof Serialization
    const proofBytes = await this.serializeProof( hashData, privateKey );

    // Encode the proofBytes as a base58-btc value
    proof.proofValue = base58btc.encode( proofBytes );

    return proof;
  }

  // Verify a proof for a secured document
  public async verifyProof (
    securedDocument: Record<string, any>,
    publicKey: Uint8Array
  ): Promise<{ verified: boolean; verifiedDocument: Record<string, any> | null }>
  {
    // Extract proof and remove proof value
    const proof: Proof = { ...securedDocument.proof };
    delete proof.proofValue;

    const unsecuredDocument = { ...securedDocument };
    delete unsecuredDocument.proof;

    const proofBytes = base58btc.decode( securedDocument.proof.proofValue );

    // 1. Transformation
    const transformedData = await this.transformDocument(
      unsecuredDocument,
      proof
    );

    // 2. Proof Configuration
    const canonicalProofConfig = await this.getProofConfiguration(
      unsecuredDocument,
      proof
    );

    // 3. Hashing
    const hashData = this.hashData( transformedData, canonicalProofConfig );

    // 4. Proof Verification
    const verified = await this.verifySerializedProof( hashData, proofBytes, publicKey );

    return {
      verified,
      verifiedDocument: verified ? unsecuredDocument : null,
    };
  }

  // Proof Configuration
  private async getProofConfiguration (
    unsecuredDocument: Record<string, any>,
    options: Proof
  ): Promise<string>
  {
    // Clone proof options
    const proofConfig = { ...options };

    // Validate required fields
    if (
      proofConfig.type !== "DataIntegrityProof" ||
      proofConfig.cryptosuite !== "eddsa-rdfc-2022"
    )
    {
      throw new Error( "PROOF_GENERATION_ERROR: Invalid type or cryptosuite" );
    }

    // Add context from document
    proofConfig[ "@context" ] = unsecuredDocument[ "@context" ];
    const jsonLd = await jsonld.toRDF( proofConfig )
    // Canonicalize the proof configuration
    return canonize.canonize( jsonLd, {
      algorithm: "URDNA2015",
      format: "application/n-quads",
    } );
  }

  // Transformation
  private async transformDocument (
    unsecuredDocument: Record<string, any>,
    options: Proof
  ): Promise<string>
  {
    if (
      options.type !== "DataIntegrityProof" ||
      options.cryptosuite !== "eddsa-rdfc-2022"
    )
    {
      throw new Error( "PROOF_TRANSFORMATION_ERROR: Invalid type or cryptosuite" );
    }
    const jsonLd = await jsonld.toRDF( unsecuredDocument )

    // Canonicalize the document
    return canonize.canonize( jsonLd, {
      algorithm: "URDNA2015",
      format: "application/n-quads",
    } );
  }

  // Hashing
  private hashData ( transformedDocument: string, canonicalProofConfig: string ): Uint8Array
  {
    const proofConfigHash = sha256( Buffer.from( canonicalProofConfig, "utf-8" ) );
    const transformedDocumentHash = sha256(
      Buffer.from( transformedDocument, "utf-8" )
    );

    // Concatenate the two hashes
    return new Uint8Array( [ ...proofConfigHash, ...transformedDocumentHash ] );
  }

  // Proof Serialization
  private async serializeProof ( hashData: Uint8Array, privateKey: Uint8Array ): Promise<Uint8Array>
  {
    return ed25519.sign( hashData, privateKey );
  }

  // Proof Verification
  private async verifySerializedProof (
    hashData: Uint8Array,
    proofBytes: Uint8Array,
    publicKey: Uint8Array
  ): Promise<boolean>
  {
    return ed25519.verify( proofBytes, hashData, publicKey );
  }
}

// Example Usage
( async () =>
{
  const cryptosuite = new EdDsaRdfc2022();

  // Example Keys
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = await ed25519.getPublicKey( privateKey );

  // Example Document
  const document = {
    "@context": [ "https://www.w3.org/2018/credentials/v1" ],
    id: "http://example.edu/credentials/3732",
    type: [ "VerifiableCredential" ],
    issuer: "https://example.edu/issuers/14",
    issuanceDate: "2024-12-11T00:00:00Z",
    credentialSubject: {
      id: "did:example:ebfeb1f712ebc6f1c276e12ec21",
      degree: {
        type: "BachelorDegree",
        name: "Bachelor of Science and Arts",
      },
    },
  };

  const proofOptions = {
    type: "DataIntegrityProof",
    created: new Date().toISOString(),
    verificationMethod: "did:example:123#key-1",
    proofPurpose: "assertionMethod",
    cryptosuite: "eddsa-rdfc-2022",
  };

  // Create Proof
  const proof = await cryptosuite.createProof( document, proofOptions, privateKey );
  // console.log("Proof:", proof);
  let triplets = await jsonld.toRDF( document )
  console.log( (await jsonld.fromRDF(( await canonize.canonize( triplets, { algorithm: 'RDFC-1.0', } ) ))),{depth:null})

  // Verify Proof
  const securedDocument = { ...document, proof };
  triplets = await jsonld.toRDF( securedDocument )
  console.log( ( await canonize.canonize( triplets, { algorithm: 'RDFC-1.0', } ) ) )
  // console.log(securedDocument)
  const result = await cryptosuite.verifyProof( securedDocument, publicKey );
  // console.log("Verification Result:", result);
} )();
