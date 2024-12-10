import { ed25519 } from '@ucanto/principal'
import * as Client from '@ucanto/client'
import { CID } from 'multiformats'

import { PrivateKey } from "@hashgraph/sdk"
import { Ed25519PubCodec, Hashing } from "./did-sdk/index"
import { baseX } from 'node_modules/multiformats/dist/src/bases/base'
import { bases } from 'multiformats/basics'

const privKey = "883409b71dc4cee7a6deba55f56a209c62ca815ed70631a43a46e57ae15d0ded"
Client.connect
const privateKey = PrivateKey.fromStringED25519( privKey )

console.log( Hashing.multibase.encode( privateKey.toBytes() ) )
const ed25519PubCodec = new Ed25519PubCodec()

console.log( ed25519PubCodec.encode( privateKey.publicKey.toBytes() ), Hashing.multibase.encode( ed25519PubCodec.encode( privateKey.publicKey.toBytes() ) ) )


async function main ()
{
  const multibaseBase58PubKey = Hashing.multibase.encode( ed25519PubCodec.encode( privateKey.publicKey.toBytes() ) )

  const service = ed25519.Verifier.parse( `did:key:${multibaseBase58PubKey}` )
  const alice = await ed25519.Signer.derive( privateKey.toBytes() )
  const bob = await ed25519.Signer.derive( privateKey.toBytes() )
  console.log(alice.did())

  // Alice delegates capability to mutate FS under bob's namespace
  const proof = await Client.delegate( {
    issuer: alice,
    audience: bob,
    capabilities: [
      {
        can: 'file/link',
        with: `https://github.com/storacha/ucanto`,
      },
    ],
  } )
  console.log(alice.verify(proof.data.,proof.data.signature))
  process.exit()
  const aboutBob = Client.invoke( {
    issuer: bob,
    audience: service,
    capability: {
      can: 'file/link',
      with: `file://${alice.did()}/friends/${bob.did()}/about`,
      link: "",
    },
  } )

  const aboutMallory = Client.invoke( {
    issuer: bob,
    audience: service,
    capability: {
      can: 'file/link',
      with: `file://${alice.did()}/friends/${MALLORY_DID}/about`,
      link: "",
    },
  } )

  // const [ bobResult, malloryResult ] = connection.execute( [
  //   aboutBob,
  //   aboutMallory,
  // ] )

  // if ( bobResult.error )
  // {
  //   console.error( 'oops', r1 )
  // } else
  // {
  //   console.log( 'about bob is linked', r1 )
  // }

  // if ( malloryResult.error )
  // {
  //   console.log( 'oops', r2 )
  // } else
  // {
  //   console.log( 'about mallory is linked', r2 )
  // }
}
main()

const demo2 = async connection =>
{
  // Alice delegates capability to mutate FS under bob's namespace
  const proof = await Client.delegate( {
    issuer: alice,
    audience: bob.principal,
    capabilities: [
      {
        can: 'file/link',
        with: `file://${alice.did()}/friends/${bob.did()}/`,
      },
    ],
  } )

  const aboutBob = Client.invoke( {
    issuer: bob,
    audience: service,
    capability: {
      can: 'file/link',
      with: `file://${alice.did()}/friends/${bob.did()}/about`,
      link: CID.parse( process.env.BOB_CID ),
    },
  } )

  const aboutMallory = Client.invoke( {
    issuer: bob,
    audience: service,
    capability: {
      can: 'file/link',
      with: `file://${alice.did()}/friends/${MALLORY_DID}/about`,
      link: CID.parse( process.env.MALLORY_CID ),
    },
  } )

  const [ bobResult, malloryResult ] = connection.execute( [
    aboutBob,
    aboutMallory,
  ] )

  if ( bobResult.error )
  {
    console.error( 'oops', r1 )
  } else
  {
    console.log( 'about bob is linked', r1 )
  }

  if ( malloryResult.error )
  {
    console.log( 'oops', r2 )
  } else
  {
    console.log( 'about mallory is linked', r2 )
  }
}