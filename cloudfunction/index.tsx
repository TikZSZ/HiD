import { Client, Databases } from 'node-appwrite';

// Initialize Appwrite client
const client = new Client();

// Replace with your Appwrite project and database information
const PROJECT_ID = 'your-project-id';
const DATABASE_ID = 'your-database-id';
const ORGANIZATION_COLLECTION_ID = 'organization-collection-id';
const KEYS_COLLECTION_ID = 'keys-collection-id';
const ORG_KEY_LINK_COLLECTION_ID = 'org-key-link-collection-id'; // Collection storing links between orgs and keys

// Configure the client with environment variables (secure practice for serverless functions)
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || '') // Appwrite Endpoint
  .setProject(PROJECT_ID) // Project ID
  .setKey(process.env.APPWRITE_API_KEY || ''); // API Key

const databases = new Databases(client);

// Cloud function handler
export default async function (req: any, res: any): Promise<void> {
  try {
    // Parse input from the request body
    const { orgId } = JSON.parse(req.payload || '{}');

    if (!orgId) {
      res.status(400).json({ error: 'Organization ID is required.' });
      return;
    }

    // Fetch organization details
    const organization = await databases.getDocument(
      DATABASE_ID,
      ORGANIZATION_COLLECTION_ID,
      orgId
    );

    // Fetch linked keys
    const keyLinks = await databases.listDocuments(
      DATABASE_ID,
      ORG_KEY_LINK_COLLECTION_ID,
      [
        `organizationId=${orgId}` // Filter by organizationId
      ]
    );

    // Extract key IDs from links
    const keyIds = keyLinks.documents.map((link: any) => link.keyId);

    // Fetch key details
    const keys = await Promise.all(
      keyIds.map((keyId: string) =>
        databases.getDocument(DATABASE_ID, KEYS_COLLECTION_ID, keyId)
      )
    );

    // Return the organization and its keys
    res.json({
      organization,
      keys,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching organization data.', details: error.message });
  }
}
