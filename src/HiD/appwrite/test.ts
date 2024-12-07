import { conf } from '@/conf/conf';
import AppwriteService, { DIDDocument, KeyDocument, OrganizationDocument } from './service';
import { KeyType, OrganizationRole } from './service';
import { Query } from 'appwrite';
import { KeyPurpose } from '../keyManager';


const userId = "6753cf7600077fe34d48"
const keyId = "6753cf760019e1ba5124"
const didId = "6753cf76002a22aecaa3"
const orgId = "6753cf780005c3687d6f"
const newUserId = "6753c625003aa4c5539e"

async function runTests ()
{
  console.log( '🚀 Starting Appwrite Service Test Suite 🚀' );
  try
  {
    // Test 1: Create User

    console.log( '\n📝 Test 1: Creating User' );
    const user = await AppwriteService.createUser( {
      name: 'John Doe',
      email: 'john.doe@example.com'
    } );
    console.log( 'User created successfully:', user.$id );

    // Test 2: Create Key for User

    console.log( '\n🔑 Test 2: Creating Key' );
    const key = await AppwriteService.createKey( user.$id, {
      salt: 'sample-salt',
      iv: 'sample-iv',
      encryptedPrivateKey: 'encrypted-private-key',
      publicKey: 'sample-public-key',
      keyType: KeyType.ENCRYPTION,
      keyPurposes: [ KeyPurpose.ASSERTION ],
      name: "test1",
    } );
    console.log( 'Key created successfully:', key.$id );

    // Test 3: Create DID for User
    console.log( '\n🆔 Test 3: Creating DID' );
    const did = await AppwriteService.createDID( user.$id, {
      identifier: 'did:example:' + Math.random().toString( 36 ).substring( 7 ),
      // publicKey: 'sample-public-key-' + Math.random().toString(36).substring(7), 
    } );
    console.log( 'DID created successfully:', did.$id );

    // Test 4: Associate Key with DID
    console.log( '\n🔗 Test 4: Associating Key with DID' );
    await AppwriteService.associateKeyWithDID( did.$id, key.$id,user.$id );
    console.log( 'Key associated with DID successfully' );

    // Test 5: Create Organization
    console.log( '\n🏢 Test 5: Creating Organization' );
    const org = await AppwriteService.createOrganization( user.$id, {
      name: 'Test Organization'
    } );
    console.log( 'Organization created successfully:', org.$id );

    // Test 6: Add Organization Member
    console.log( '\n👥 Test 6: Adding Organization Member' );
    const newUser = await AppwriteService.createUser( {
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    } );
    await AppwriteService.addOrganizationMember( org.$id, user.$id,newUser.$id, OrganizationRole.MEMBER );
    console.log( 'New member added to organization successfully' );

    // Test 7: Link Organization Key
    console.log( '\n🔐 Test 7: Linking Organization Key' );
    await AppwriteService.linkOrganizationKey( org.$id, key.$id, user.$id );
    console.log( 'Key linked to organization successfully' );

    // Test 8: Retrieve User with Relations
    console.log( '\n🕵️ Test 8: Retrieving User with Relations' );
    const retrievedUser = await AppwriteService.getUser( user.$id );
    console.log( 'User retrieved successfully:', {
      name: retrievedUser.name,
      email: retrievedUser.email,
      // didsCount: retrievedUser.dids.length,
      // keysCount: retrievedUser.keys.length,
      // organizationName: retrievedUser.organization?.name
    } );

    console.log( '\n✅ All tests completed successfully! ✅' );
  } catch ( error )
  {
    console.error( '❌ Test Suite Failed:', error );
  }
}



const main = async () =>
{
  const user = await AppwriteService.getUser( userId )
  console.dir( user, { depth: Infinity } )
  const keys = await AppwriteService.databases.listDocuments<KeyDocument>(
    conf.appwrtieDBId,
    conf.appwriteKeysCollID,
    [ Query.equal( 'org', orgId ) ]
  );
  console.log( keys )
  const orgs = await AppwriteService.databases.listDocuments<DIDDocument>(
      conf.appwrtieDBId,
      conf.appwriteOrgsCollID,
      [Query.equal("owner",userId)]
    );
  console.dir(orgs,{depth:Infinity})
  const orgMembers = await AppwriteService.databases.listDocuments<DIDDocument>(
    conf.appwrtieDBId,
    conf.appwriteUsersCollID,
    [Query.equal("org",orgs.documents[0].$id)]
  );
  console.dir(orgMembers,{depth:Infinity})

  // const dids = await AppwriteService.databases.listDocuments<DIDDocument>(
  //   conf.appwrtieDBId,
  //   conf.appwriteDIDsCollID,
  //   [ Query.equal( 'ownerId', userId ) ]
  // );
  // console.error(dids.documents[0].keys)
  // console.log( dids )
  // // Fetch related Keys
  // const keys = await AppwriteService.databases.listDocuments<KeyDocument>(
  //   conf.appwrtieDBId,
  //   conf.appwriteKeysCollID,
  //   [ Query.equal( 'ownerId', userId ) ]
  // );
  // console.log( keys )

  // // Fetch organization if exists
  // let organization = null;
  // if ( orgId )
  // {
  //   organization = await AppwriteService.databases.getDocument<OrganizationDocument>(
  //     conf.appwrtieDBId,
  //     conf.appwriteOrgsCollID,
  //     orgId
  //   );
  //   console.log( organization )
  // }
}
// Run the tests
// runTests();
main()
