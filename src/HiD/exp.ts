import { PrivateKey } from "@hashgraph/sdk"
import {Ed25519PubCodec,Hashing} from "./did-sdk/index"

const privKey = "883409b71dc4cee7a6deba55f56a209c62ca815ed70631a43a46e57ae15d0ded"

const privateKey = PrivateKey.fromStringED25519(privKey)

console.log(Hashing.multibase.encode(privateKey.toBytes()))
const ed25519PubCodec = new Ed25519PubCodec()

console.log(ed25519PubCodec.encode(privateKey.toBytes()),Hashing.multibase.encode(ed25519PubCodec.encode(privateKey.toBytes())))

