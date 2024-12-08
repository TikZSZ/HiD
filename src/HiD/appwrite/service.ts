import { Models } from 'appwrite';
import { Client, Databases, ID, Query, Permission, Role } from 'appwrite';
import { conf } from '../../conf/conf';
// Enum Definitions
export enum KeyType
{
  ENCRYPTION = 'ENCRYPTION',
  SIGNING = 'SIGNING',
  ENCRYPTION_AND_SIGNING = 'ENCRYPTION_AND_SIGNING'
}

export enum KeyPurpose
{
  AUTHENTICATION = "authentication",
  ASSERTION = "assertion",
  KEY_AGREEMENT = "key_agreement",
  CAPABILITY_DELEGATION = "capability_delegation",
  CAPABILITY_INVOCATION = "capability_invocation",
}
export enum OrganizationRole
{
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VERIFIER = 'VERIFIER'
}


// Interface for DIDs Collection
export interface DIDDocument extends Models.Document
{
  identifier: string;
  owner: UserDocument;
  keys: KeyDocument[]
  name:string
}

// Interface for Keys Collection
export interface KeyDocument extends Models.Document
{
  salt: string;
  iv: string;
  encryptedPrivateKey: string;
  publicKey: string;
  keyType: KeyType;
  keyPurposes: KeyPurpose[]; // More flexible than previous enum
  owner: UserDocument;
  org: OrganizationDocument;
  dids: DIDDocument[];
  name: string,
  description?: string
}

// Interface for Users Collection
export interface UserDocument extends Models.Document
{
  name: string;
  email: string;
  organizationRole: OrganizationRole
  org: OrganizationDocument // member of that org
  orgs:OrganizationDocument[]
}

// Interface for Organizations Collection
export interface OrganizationDocument extends Models.Document
{
  name: string;
  description?: string
  owner: UserDocument;
  members:UserDocument[]
}

interface CreateUserDto
{
  name: string,
  email: string,
}

// Data Transfer Interfaces for Operations
export interface CreateDIDDto
{
  identifier: string;
  keyId?:string
  name:string
}

export interface CreateKeyDto
{
  salt: string;
  iv: string;
  encryptedPrivateKey: string;
  publicKey: string;
  keyType: KeyType;
  keyPurposes?: string[];
  name: string;
  description?: string;
}

export interface CreateOrganizationDto
{
  name: string;
  description?: string;
}

export interface AddOrganizationMemberDto
{
  memberId:string,
  orgId:string
}

export interface UpdateUserDto
{
  name?: string;
  email?: string;
  orgId?: string;
}

export interface KeyAssociationDto
{
  keyId: string;
  didId?: string;
  orgId?: string;
  purposes?: string[];
  role?: OrganizationRole;
}

// Utility Types for Complex Queries and Transformations
export type DIDWithRelations = DIDDocument & {
  owner?: UserDocument;
  associatedKeys?: KeyDocument[];
}

export type KeyWithRelations = KeyDocument & {
  owner?: UserDocument;
  associatedDIDs?: DIDDocument[];
  associatedOrg?: OrganizationDocument;
}

export type OrganizationWithRelations = OrganizationDocument & {
  owner?: UserDocument;
  associatedKeys?: KeyDocument[];
  memberDetails?: UserDocument[];
}



class AppwriteService
{
  private client: Client;
  databases: Databases;

  constructor()
  {
    this.client = new Client()
      .setEndpoint( conf.appwriteEndpoint )
      .setProject( conf.appwrtieProjectId );

    this.databases = new Databases( this.client );
  }

  // User Operations
  async createUser ( userData: CreateUserDto, userId?: string ): Promise<UserDocument>
  {
    try
    {
      const documentId = userId || ID.unique();
      return await this.databases.createDocument<UserDocument>(
        conf.appwrtieDBId,
        conf.appwriteUsersCollID,
        documentId,
        userData,
        // [
        //   Permission.read( Role.user( documentId ) ),
        //   Permission.update( Role.user( documentId ) ),
        //   Permission.delete( Role.user( documentId ) )
        // ]
      );
    } catch ( error )
    {
      console.error( 'Error creating user:', error );
      throw error;
    }
  }

  async updateUser ( userId: string, userData: UpdateUserDto ): Promise<UserDocument>
  {
    try
    {
      return await this.databases.updateDocument<UserDocument>(
        conf.appwrtieDBId,
        conf.appwriteUsersCollID,
        userId,
        userData
      );
    } catch ( error )
    {
      console.error( 'Error updating user:', error );
      throw error;
    }
  }
  // Promise<UserWithRelations>
  async getUser ( userId: string )
  {
    try
    {
      const user = await this.databases.getDocument<UserDocument>(
        conf.appwrtieDBId,
        conf.appwriteUsersCollID,
        userId
      );

      return user;
    } catch ( error )
    {
      console.error( 'Error fetching user:', error );
      throw error;
    }
  }

  // DID Operations
  async createDID (
    userId: string,
    didData: CreateDIDDto,
  )
  {
    const {keyId,...rest} = didData
    const keys = keyId ? [keyId]:[]
    try
    {
      // Create DID document
      const didDocument = await this.databases.createDocument<DIDDocument>(
        conf.appwrtieDBId,
        conf.appwriteDIDsCollID,
        ID.unique(),
        {
          ...rest,
          owner: userId,
          keys: keys // Start with no keys
        },
        // [
        //   Permission.read( Role.user( userId ) ),
        //   Permission.update( Role.user( userId ) ),
        //   Permission.delete( Role.user( userId ) )
        // ]
      );

      return didDocument;
    } catch ( error )
    {
      console.error( 'Error creating DID:', error );
      throw error;
    }
  }

  async getDIDs ( ownerId:string )
  {
    // Fetch related Keys
    const dids = await this.databases.listDocuments<DIDDocument>(
      conf.appwrtieDBId,
      conf.appwriteDIDsCollID,
      [Query.equal("owner",ownerId)]
    );
    return dids.documents
  }

  async getDID ( ownerId:string,didId:string )
  {
    // Fetch related Keys
    const dids = await this.databases.getDocument<DIDDocument>(
      conf.appwrtieDBId,
      conf.appwriteKeysCollID,
      didId,
      [Query.equal("owner",ownerId)]
    );
    return dids
  }

  async associateKeyWithDID (
    didId: string,
    keyId: string,
    userId: string
  ): Promise<void>
  {
    try
    {
      // Get current DID
      const did = await this.databases.getDocument<DIDDocument>(
        conf.appwrtieDBId,
        conf.appwriteDIDsCollID,
        didId
      );

      // Get current key
      const key = await this.databases.getDocument<KeyDocument>(
        conf.appwrtieDBId,
        conf.appwriteKeysCollID,
        keyId
      );
      console.log(keyId,userId,key)
      if ( key.owner.$id !== userId && did.owner.$id !== userId ) throw new Error( "Keys or did is not owend by user" )
      // Update DID to include key
      await this.databases.updateDocument<DIDDocument>(
        conf.appwrtieDBId,
        conf.appwriteDIDsCollID,
        didId,
        {
          keys: [ ...new Set( [ ...( did.keys || [] ), keyId ] ) ]
        }
      );

      // Update key to include DID
      await this.databases.updateDocument<KeyDocument>(
        conf.appwrtieDBId,
        conf.appwriteKeysCollID,
        keyId,
        {
          dids: [ ...new Set( [ ...( key.dids || [] ), didId ] ) ]
        }
      );
    } catch ( error )
    {
      console.error( 'Error associating key with DID:', error );
      throw error;
    }
  }

  // Key Operations
  async createKey (
    userId: string,
    keyData: CreateKeyDto
  ): Promise<KeyDocument>
  {
    console.log(userId,keyData)
    try
    {
      // Create key document
      const keyDocument = await this.databases.createDocument<KeyDocument>(
        conf.appwrtieDBId,
        conf.appwriteKeysCollID,
        ID.unique(),
        {
          ...keyData,
          owner: userId,
          dids: [],
          org: null
        },
        // [
        //   Permission.read( Role.user( userId ) ),
        //   Permission.update( Role.user( userId ) ),
        //   Permission.delete( Role.user( userId ) )
        // ]
      );

      return keyDocument;
    } catch ( error )
    {
      console.error( 'Error creating key:', error );
      throw error;
    }
  }

  async getKeys ( userId: string )
  {
    // Fetch related Keys
    const keys = await this.databases.listDocuments<KeyDocument>(
      conf.appwrtieDBId,
      conf.appwriteKeysCollID,
      [ Query.equal( 'owner', userId ) ]
    );
    return keys.documents
  }

  async getKey ( ownerId:string,keyId: string )
  {
    // Fetch related Keys
    const keys = await this.databases.getDocument<KeyDocument>(
      conf.appwrtieDBId,
      conf.appwriteKeysCollID,
      keyId
    );
    return keys
  }

  async getKeysForOrg ( ownerId:string,orgId: string )
  {
    // Fetch related Keys
    const keys = await this.databases.listDocuments<KeyDocument>(
      conf.appwrtieDBId,
      conf.appwriteKeysCollID,
      [Query.equal("owner",ownerId),Query.equal("org",orgId)]
    );
    return keys
  }


  async deleteKey ( userId: string, id: string )
  {
    const key = await this.getKey( userId,id )
    if (!key) throw new Error( "Key doesn't belong to user" )
    return this.databases.deleteDocument(
      conf.appwrtieDBId,
      conf.appwriteKeysCollID,
      id
    );
  }


  // Organization Operations
  async createOrganization (
    userId: string,
    orgData: CreateOrganizationDto
  )
  {
    try
    {
      // Create organization document
      const orgDocument = await this.databases.createDocument<OrganizationDocument>(
        conf.appwrtieDBId,
        conf.appwriteOrgsCollID,
        ID.unique(),
        {
          ...orgData,
          owner: userId,
          
        },
        [
          // Permission.read( Role.users() ),
          // Permission.update( Role.user( userId ) ),
          // Permission.delete( Role.user( userId ) )
        ]
      );

      return orgDocument
    } catch ( error )
    {
      console.error( 'Error creating organization:', error );
      throw error;
    }
  }

  async getOrgnisations(userId:string){
    const orgs = await this.databases.listDocuments<OrganizationDocument>(
      conf.appwrtieDBId,
      conf.appwriteOrgsCollID,
      [ Query.equal( 'owner', userId ) ]
    );
    return orgs.documents
  }

  async getOrgMembers(orgId:string){
    const members = await this.databases.listDocuments<UserDocument>(
      conf.appwrtieDBId,
      conf.appwriteUsersCollID,
      [ Query.equal( 'org',orgId ) ]
    );
    return members.documents
  }

  async addOrganizationMember (
    orgId: string,
    ownerId: string,
    memberId: string,
    role: OrganizationRole = OrganizationRole.MEMBER
  ): Promise<void>
  {
    try
    {
      // Get current organization
      const org = await this.databases.getDocument<OrganizationDocument>(
        conf.appwrtieDBId,
        conf.appwriteOrgsCollID,
        orgId
      );
      if ( org.owner.$id !== ownerId ) throw new Error( "U do not have permission to add users to orgnisation" )

      // Update organizations memebrs
      await this.databases.updateDocument<OrganizationDocument>(
        conf.appwrtieDBId,
        conf.appwriteOrgsCollID,
        orgId,
        {
          members: [ ...new Set( [ ...( org.members || [] ), memberId ] ) ]
        }
      );
      this.databases.getDocument("","",Query.equal("id",["d"]))
      console.log("fetching the user",memberId)
      const user = await this.getUser(memberId)
      // Update user's organization
      await this.databases.updateDocument<UserDocument>(
        conf.appwrtieDBId,
        conf.appwriteUsersCollID,
        memberId,
        {
          organizationRole: role,
          orgs: [ ...new Set( [ ...( user.orgs || [] ), orgId ] ) ]
        }
      );
    } catch ( error )
    {
      console.error( 'Error adding organization member:', error );
      throw error;
    }
  }

  async linkOrganizationKey (
    orgId: string,
    keyId: string,
    userId: string
  ): Promise<void>
  {
    try
    {
      // Get current organization
      const org = await this.databases.getDocument<OrganizationDocument>(
        conf.appwrtieDBId,
        conf.appwriteOrgsCollID,
        orgId
      );
      const user = await this.databases.getDocument<UserDocument>(
        conf.appwrtieDBId,
        conf.appwriteUsersCollID,
        userId
      );
      if ( ( user.org && user.org.$id !== orgId ) && org.owner.$id !== userId ) throw new Error( "User account does not belong to the orgnisation" )
      // Get current key
      const key = await this.databases.getDocument<KeyDocument>(
        conf.appwrtieDBId,
        conf.appwriteKeysCollID,
        keyId
      );
      if ( key.owner.$id !== userId ) throw new Error( "Key Doesnt belong to user" )

      // Update key to include organization
      await this.databases.updateDocument<KeyDocument>(
        conf.appwrtieDBId,
        conf.appwriteKeysCollID,
        keyId,
        {
          org: orgId
        }
      );
    } catch ( error )
    {
      console.error( 'Error linking organization key:', error );
      throw error;
    }
  }
  async getOrganizationsForKey(ownerId:string,keyId:string){
    const keys = await this.databases.listDocuments<OrganizationDocument>(
      conf.appwrtieDBId,
      conf.appwriteOrgsCollID,
      [Query.equal("owner",ownerId),Query.equal("org",keyId)]
    );
    return keys.documents
  }
}

export default new AppwriteService();