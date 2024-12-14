import { Client, Databases, Query } from 'node-appwrite';
const client = new Client();

// Replace with your Appwrite project and database information
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID as string;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID as string;
const ORGANIZATION_COLLECTION_ID = '67539a8d001733710852';
const KEYS_COLLECTION_ID = '67539909001c0e8577dd';
const ORG_KEY_LINK_COLLECTION_ID = 'org-key-link-collection-id'; // Collection storing links between orgs and keys

// Configure the client with environment variables (secure practice for serverless functions)
client
  .setEndpoint( process.env.VITE_APPWRITE_ENDPOINT || '' ) // Appwrite Endpoint
  .setProject( PROJECT_ID ) // Project ID
  .setKey( process.env.APPWRITE_API_KEY || '' ); // API Key

const databases = new Databases( client );

// Cloud function handler
export default async function ( {req,res,log,error}:any ): Promise<void>
{
  try
  {
    // Parse input from the request body
    // log(JSON.stringify(req))
    log(req.query,req.path)
    const orgId = (req.path as string).split("/")[2]
    // const { orgId, keyId } = req.query
    if ( !orgId )
    {
      res.status( 400 ).json( { error: 'Organization ID is required.' } );
      return;
    }
    // Fetch organization details
    const organization = await databases.getDocument(
      DATABASE_ID,
      ORGANIZATION_COLLECTION_ID,
      orgId
    );
    if(!organization) throw new Error("Organization not found")
    log( orgId, organization )

    // Fetch linked keys
    const keys = ( await databases.listDocuments(
      DATABASE_ID,
      KEYS_COLLECTION_ID,
      [
        Query.equal( "org", orgId ) // Filter by organizationId
      ]
    ) ).documents;
    // console.log(keyLinks)
    const controller = `did:web:https://675d93dc69da7be75efd.appwrite.global/issuers/${orgId}`
    const assertionMethods = keys.map( ( key ) => ( {
      '@context': 'https://w3id.org/security/multikey/v1',
      type: 'Multikey',
      controller: controller,
      id: controller+"#"+key.$id,
      publicKeyMultibase:key.publicKey
    } ) )
    const controllerMultikey = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/multikey/v1'
      ],
      id: controller,
      alsoKnownAs:organization.name,
      assertionMethod: assertionMethods
    };
    // Extract key IDs from links
    // const keyIds = keyLinks.documents.map((link: any) => link.keyId);

    // Fetch key details
    // const keys = await Promise.all(
    //   keyIds.map((keyId: string) =>
    //     databases.getDocument(DATABASE_ID, KEYS_COLLECTION_ID, keyId)
    //   )
    // );
    log(controllerMultikey)
    // Return the organization and its keys
    return res.json(controllerMultikey,200);
  } catch ( err: any )
  {
    error("Error:" + err.message);
    return res.json(
      {
        success: false,
        error: err.message,
      },
      400
    );
  }
}
