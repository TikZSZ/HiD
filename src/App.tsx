import { Outlet, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Skeleton } from "./components/ui/skeleton";
import { useWallet } from "./contexts/hashconnect";
import { createDidDocument, registerDidDocument, loadDidDocument } from "@/did"
const Navbar = lazy( () => import( "@/components/app/Navbar" ) );
import { Client, LedgerId, PrivateKey, AccountId } from "@hashgraph/sdk"
import { HcsDid, HcsDidEventMessageResolver } from "@/HiD/did-sdk";
import { useToast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";
import * as Bls12381Multikey from "@digitalbazaar/bls12-381-multikey"
import * as ED25519Multikey from "@digitalbazaar/ed25519-multikey"

import {base58_to_binary,binary_to_base58} from "base58-js"
function App ()
{
  let location = useLocation();
  const { isConnected, accountIds, selectedAccount, getHederaClient, hashconnect } = useWallet()
  const {toast} = useToast()
  useEffect(()=>{
    // toast({title:"Hello",description:"Hi"})
    (async () => {
      // const keyPair2 = await Bls12381Multikey.generateBbsKeyPair({
      //   algorithm: Bls12381Multikey.ALGORITHMS.BBS_BLS12381_SHA256
      // });
      // console.log(keyPair2.signer(),keyPair2.verifier())
      // const exported = await keyPair.export({publicKey:true,secretKey:true})
      // console.log(base58_to_binary(exported.secretKeyMultibase),binary_to_base58(base58_to_binary(exported.secretKeyMultibase)))
      // console.log(keyPair,exported,(await Bls12381Multikey.from(exported)))
      // const keyPair = await ED25519Multikey.generate()
      // const privKey  = PrivateKey.fromBytesED25519(keyPair.secretKey)
      // const data = privKey.sign(new Uint8Array([2,3,5]))
      // console.log(privKey.publicKey.verify(data,privKey.sign(data)))
      // console.log(keyPair.signer(),keyPair.verifier(),(await keyPair.signer().sign({data})))
      // console.log(await keyPair.verifier().verify({data,signature:await keyPair.signer().sign({data})}))
      // console.log(await keyPair2.verifier().verify({data,signature:await keyPair2.signer().sign({data})}))
    })()
  },[])
  // useEffect( () =>
  // {
  //   ( async () =>
  //   {
  //     if ( isConnected )
  //     {

  //       // const client = Client.forTestnet().setOperator( "0.0.4679069", "883409b71dc4cee7a6deba55f56a209c62ca815ed70631a43a46e57ae15d0ded" )
  //       const client = getHederaClient()
  //       const signer = hashconnect?.getSigner( AccountId.fromString( selectedAccount! ) as any )
  //       if ( signer )
  //       {

  //         let didDocument = createDidDocument( { privateKey: PrivateKey.fromStringED25519( "883409b71dc4cee7a6deba55f56a209c62ca815ed70631a43a46e57ae15d0ded" ), signer } as any )
  //         console.log( signer )
  //         didDocument = await registerDidDocument( didDocument )
  //         console.log( didDocument.getIdentifier() )
  //         // const did = new HcsDid( { identifier: "did:hedera:testnet:z5a8Rn45srQuWTfUwEMs3JtmBfjaNo75chp6DPpWh3D2x_0.0.5214741" } );
  //       const registeredDid = didDocument
  //       const serviceIdentifier = "did:hedera:testnet:z6MkubW6fwkWSA97RbKs17MtLgWGHBtShQygUc5SeHueFCaG_0.0.29656231";
  //       await registeredDid.addService({
  //           id: serviceIdentifier + "#service-1",
  //           type: "LinkedDomains",
  //           serviceEndpoint: "https://example.com/vcs",
  //       });
    
  //       console.log("\n");
  //       console.log("Added");
  //       let didDoc = await registeredDid.resolve();
  //       console.log(didDoc.toJsonTree());
    
  //       /**
  //        * Update Service
  //        * ID must be same as ADD Service Event to update it
  //        */
  //       await registeredDid.updateService({
  //           id: serviceIdentifier + "#service-1",
  //           type: "LinkedDomains",
  //           serviceEndpoint: "https://test.com/did",
  //       });
    
  //       console.log("\n");
  //       console.log("Updated");
  //       didDoc = await registeredDid.resolve();
  //       console.log(didDoc.toJsonTree());
    
  //       /**
  //        * Revoke Service
  //        */
  //       await registeredDid.revokeService({
  //           id: serviceIdentifier + "#service-1",
  //       });
    
  //       console.log("\n");
  //       console.log("Revoked");
  //       didDoc = await registeredDid.resolve();
  //       console.log(didDoc.toJsonTree());
    
  //       console.log("\n");
  //       console.log("Registered DID Information");
  //       // console.log(`DID PRIVATE KEY: ${didPrivateKey.toString()}`);
  //       // console.log(`DID PUBLIC KEY: ${didPrivateKey.publicKey.toString()}`);
  //       console.log(registeredDid.getIdentifier());
  //         /**
  //          * Read DID resolver setup
  //          */

  //       }
  //     }

  //   } )()
  // }, [ selectedAccount, accountIds, isConnected ] )
  return (
    <>
      <div className="relative min-h-screen bg-background text-foreground">
        {/* {(!!location.pathname!.match(RegExp("dashboard*")))? <></>:<Navbar />} */}
        <Navbar />
        <Outlet />
        <Toaster />
        {!location.pathname.includes( "dashboard" ) ? (
          <footer className="bg-muted py-8">
            <div className="max-w-6xl mx-auto px-4 text-center text-muted-foreground">
              © 2024 HederaDID. All rights reserved.
            </div>
          </footer>
        ) : null}
      </div>
    </>
  );
}

export default App;