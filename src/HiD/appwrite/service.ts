import { Models } from 'appwrite';

// Enum Definitions
export enum KeyType
{
  ENCRYPTION = 'ENCRYPTION',
  SIGNING = 'SIGNING',
  ENCRYPTION_AND_SIGNING = 'ENCRYPTION_AND_SIGNING'
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
  ownerId: UserDocument;
  keys: KeyDocument[]; // Array of key IDs
  publicKey: string;
  organizationRole: OrganizationRole
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
  ownerId: UserDocument;
  orgId: OrganizationDocument;
  dids: DidDocument[];
}

// Interface for Users Collection
export interface UserDocument extends Models.Document
{
  name: string;
  email: string;
  organizationRole:OrganizationRole
  // keys: KeyDocument[]; // Array of key IDs
  // dids: DidDocument[]; // Array of DID IDs
  // orgId: OrganizationDocument; // Optional organization ID
}

// Interface for Organizations Collection
export interface OrganizationDocument extends Models.Document
{
  name: string;
  keys: KeyDocument[]; // Array of key IDs
  ownerId: UserDocument;
  members: UserDocument[]; // Array of user IDs
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
  // publicKey: string;
}

export interface CreateKeyDto
{
  salt: string;
  iv: string;
  encryptedPrivateKey: string;
  publicKey: string;
  keyType: KeyType;
  keyPurposes?: string[];
  name:string;
  description?: string;
}

export interface CreateOrganizationDto
{
  name: string;
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

import { Client, Databases, ID, Query, Permission, Role } from 'appwrite';
import { conf } from '../../conf/conf';
import { DidDocument } from '../did-sdk';
import { KeyPurpose } from '../keyManager';


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
  async getUser ( userId: string ): Promise<any>
  {
    try
    {
      const user = await this.databases.getDocument<UserDocument>(
        conf.appwrtieDBId,
        conf.appwriteUsersCollID,
        userId
      );
      // console.log(user)
      // // Fetch related DIDs
      // const dids = await this.databases.listDocuments<DIDDocument>(
      //   conf.appwrtieDBId,
      //   conf.appwriteDIDsCollID,
      //   [ Query.equal( 'ownerId', userId ) ]
      // );

      // // Fetch related Keys
      // const keys = await this.databases.listDocuments<KeyDocument>(
      //   conf.appwrtieDBId,
      //   conf.appwriteKeysCollID,
      //   [ Query.equal( 'ownerId', userId ) ]
      // );

      // // Fetch organization if exists
      // let organization = null;
      // if ( user.orgId )
      // {
      //   organization = await this.databases.getDocument<OrganizationDocument>(
      //     conf.appwrtieDBId,
      //     conf.appwriteOrgsCollID,
      //     user.orgId
      //   );
      // }

      return {
        ...user,
        // dids: dids.documents,
        // keys: keys.documents,
        // organization
      };
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
  ): Promise<DIDWithRelations>
  {
    try
    {
      // Create DID document
      const didDocument = await this.databases.createDocument<DIDDocument>(
        conf.appwrtieDBId,
        conf.appwriteDIDsCollID,
        ID.unique(),
        {
          ...didData,
          ownerId: userId,
          keys: [] // Start with no keys
        },
        // [
        //   Permission.read( Role.user( userId ) ),
        //   Permission.update( Role.user( userId ) ),
        //   Permission.delete( Role.user( userId ) )
        // ]
      );

      // // Update user's DIDs
      // const user = await this.databases.getDocument<UserDocument>(
      //   conf.appwrtieDBId,
      //   conf.appwriteUsersCollID,
      //   userId
      // );

      // await this.databases.updateDocument<UserDocument>(
      //   conf.appwrtieDBId,
      //   conf.appwriteUsersCollID,
      //   userId,
      //   {
      //     dids: [ ...( user.dids || [] ), didDocument.$id ]
      //   }
      // );

      return {
        ...didDocument,
        // owner: user
      };
    } catch ( error )
    {
      console.error( 'Error creating DID:', error );
      throw error;
    }
  }

  async associateKeyWithDID (
    didId: string,
    keyId: string
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
  ): Promise<KeyWithRelations>
  {
    try
    {
      // Create key document
      const keyDocument = await this.databases.createDocument<KeyDocument>(
        conf.appwrtieDBId,
        conf.appwriteKeysCollID,
        ID.unique(),
        {
          ...keyData,
          ownerId: userId,
          dids: [],
          orgId: null
        },
        // [
        //   Permission.read( Role.user( userId ) ),
        //   Permission.update( Role.user( userId ) ),
        //   Permission.delete( Role.user( userId ) )
        // ]
      );

      // Update user's keys
      // const user = await this.databases.getDocument<UserDocument>(
      //   conf.appwrtieDBId,
      //   conf.appwriteUsersCollID,
      //   userId
      // );

      // await this.databases.updateDocument<UserDocument>(
      //   conf.appwrtieDBId,
      //   conf.appwriteUsersCollID,
      //   userId,
      //   {
      //     keys: [ ...( user.keys || [] ), keyDocument.$id ]
      //   }
      // );

      return {
        ...keyDocument,
        // owner: user
      };
    } catch ( error )
    {
      console.error( 'Error creating key:', error );
      throw error;
    }
  }

  // Organization Operations
  async createOrganization (
    userId: string,
    orgData: CreateOrganizationDto
  ): Promise<OrganizationWithRelations>
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
          ownerId: userId,
          // members: [ userId ],
          // keys: []
        },
        [
          // Permission.read( Role.users() ),
          // Permission.update( Role.user( userId ) ),
          // Permission.delete( Role.user( userId ) )
        ]
      );

      // // Update user's organization
      // await this.databases.updateDocument<UserDocument>(
      //   conf.appwrtieDBId,
      //   conf.appwriteUsersCollID,
      //   userId,
      //   {
      //     orgId: orgDocument.$id,
      //     organizationRole:OrganizationRole.OWNER
      //   }
      // );

      return {
        ...orgDocument,
        // owner: await this.getUser( userId ),
        // memberDetails: [ await this.getUser( userId ) ]
      };
    } catch ( error )
    {
      console.error( 'Error creating organization:', error );
      throw error;
    }
  }

  async addOrganizationMember (
    orgId: string,
    userId: string,
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
      console.log(org)
      // Update organization members
      await this.databases.updateDocument<OrganizationDocument>(
        conf.appwrtieDBId,
        conf.appwriteOrgsCollID,
        orgId,
        {
          members: [ ...new Set( [ ...( org.members || [] ), userId ] ) ]
        }
      );
      console.log("i came here")
      // Update user's organization
      await this.databases.updateDocument<UserDocument>(
        conf.appwrtieDBId,
        conf.appwriteUsersCollID,
        userId,
        {
          orgId: orgId,
          organizationRole: role
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
    userId:string
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

      // Get current key
      const key = await this.databases.getDocument<KeyDocument>(
        conf.appwrtieDBId,
        conf.appwriteKeysCollID,
        keyId
      );
      if(key.ownerId.$id !== userId) throw new Error("Key Doesnt belong to user")
      // Update organization to include key
      // await this.databases.updateDocument<OrganizationDocument>(
      //   conf.appwrtieDBId,
      //   conf.appwriteOrgsCollID,
      //   orgId,
      //   {
      //     keys: [ ...new Set( [ ...( org.keys || [] ), keyId ] ) ]
      //   }
      // );

      // Update key to include organization
      await this.databases.updateDocument<KeyDocument>(
        conf.appwrtieDBId,
        conf.appwriteKeysCollID,
        keyId,
        {
          orgId: orgId
        }
      );
    } catch ( error )
    {
      console.error( 'Error linking organization key:', error );
      throw error;
    }
  }
}

export default new AppwriteService();