import { } from "@ucanto/core";

import { capability,Signer,Capability } from "@ucanto/server";
import * as principal from '@ucanto/principal'

// Utility function to convert hex to Uint8Array
const hexToUint8Array = (hex: string): Uint8Array =>
  new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

// Hedera Ed25519 key pair
const privateKeyHex = "YOUR_PRIVATE_KEY_HEX";
const publicKeyHex = "YOUR_PUBLIC_KEY_HEX";
principal.ed25519.parse()
// Convert keys
const privateKey = hexToUint8Array(privateKeyHex);
const publicKey = hexToUint8Array(publicKeyHex);

// Create the user's DID
const userSigner = principal.ed25519.from({ publicKey, secretKey: privateKey });
const userDID = userSigner.did();

// Service DID (public key-based identifier)
const servicePublicKeyHex = "SERVICE_PUBLIC_KEY_HEX";
const servicePublicKey = hexToUint8Array(servicePublicKeyHex);
const serviceSigner = principal.ed25519.derive({ publicKey: servicePublicKey });
const serviceDID = serviceSigner.did();

// Log DIDs
console.log("User DID:", userDID);
console.log("Service DID:", serviceDID);

// Define a Capability
const storageCapability: Capability = {
  with: "storage://example-service",
  can: "upload",
};

async function createUCAN() {
  // Create a Delegation
  const delegation = await Delegation.delegate({
    issuer: userSigner, // User is issuing the UCAN
    audience: serviceDID, // The service being delegated
    capabilities: [storageCapability], // Grant upload capability to service
    lifetimeInSeconds: 3600, // Token is valid for 1 hour
  });

  console.log("Generated UCAN JWT:", delegation.export());
  return delegation;
}

async function verifyUCAN(jwt: string) {
  // Import the delegation
  const delegation = await Delegation.import(jwt);

  // Verify the UCAN
  const result = await delegation.verify({
    async resolve(did) {
      if (did === userDID) return userSigner;
      throw new Error(`Unknown DID: ${did}`);
    },
  });

  if (result.ok) {
    console.log("UCAN verification successful.");
    console.log("Granted Capabilities:", delegation.capabilities);
    delegation.capabilities.forEach(cap => {
      if (cap.with === "storage://example-service" && cap.can === "upload") {
        console.log("Service is authorized to upload.");
      }
    });
  } else {
    console.error("UCAN verification failed:", result.error);
  }
}

(async () => {
  // Step 1: Create a UCAN
  const delegation = await createUCAN();

  // Step 2: Export the UCAN as a JWT
  const jwt = delegation.export();

  // Step 3: Verify the UCAN
  await verifyUCAN(jwt);
})();
