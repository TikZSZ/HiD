import { Outlet, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { useWallet } from "./contexts/hashconnect";
const Navbar = lazy( () => import( "@/components/app/Navbar" ) );
import { Client, LedgerId, PrivateKey, AccountId } from "@hashgraph/sdk"
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
  return (
    <>
      <div className="relative min-h-screen bg-background text-foreground">
        {/* {(!!location.pathname!.match(RegExp("dashboard*")))? <></>:<Navbar />} */}
        <Navbar />
        <Outlet />
        <Toaster />
        {!location.pathname.includes( "dashboard" ) ? (
          <footer className="py-8 bg-background border-t text-center">
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} HiD. All rights reserved.
          </p>
        </footer>
        ) : null}
      </div>
    </>
  );
}

export default App;