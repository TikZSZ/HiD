import { Models } from 'appwrite';
import { Client, Databases, ID, Query, Permission, Role, Storage } from 'appwrite';
import { conf } from '../../conf/conf';
// Enum Definitions
export enum KeyType
{
  ENCRYPTION = 'ENCRYPTION',
  SIGNING = 'SIGNING',
  SELECTIVE_DISCLOSURE = "SELECTIVE_DISCLOSURE"
}
export enum KeyAlgorithm
{
  // RSA_4096 = "RSA_4096",
  BBS_2023 = "BBS_2023",
  ED25519 = "ED25519"
}
export enum KeyPurpose
{
  AUTHENTICATION = "assertionMethod",
  ASSERTION = "authentication",
  KEY_AGREEMENT = "keyAgreement",
  CAPABILITY_DELEGATION = "capabilityDelegation",
  CAPABILITY_INVOCATION = "capabilityInvocation",
}
export enum OrganizationRole
{
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VERIFIER = 'VERIFIER'
}

export enum VCStoreType
{
  CLOUD = "CLOUD", //default
  IPFS = "IPFS",
  HEDERA_TOPIC = "HEDERA_TOPIC",
  HEDERA_FILE = "HEDERA_FILE"
}

export enum StoredByEnum
{
  ORG = "ORG",
  USER = "USER",
}

export interface VCDocument extends Models.Document
{
  identifier: string;
  holder?: UserDocument;
  issuer: OrganizationDocument;
  signedBy: KeyDocument;
}

export interface VCStoreDocument extends Models.Document
{
  vcId: string;
  location: string;
  storageType: VCStoreType
  storedBy: StoredByEnum
}

// Interface for DIDs Collection
export interface DIDDocument extends Models.Document
{
  identifier: string;
  owner: UserDocument;
  keys: KeyDocument[]
  name: string
}

export interface RoleDocument extends Models.Document
{
  userId: string
  orgId: string
  roles: OrganizationRole[]
}

// Interface for Keys Collection
export interface KeyDocument extends Models.Document
{
  salt: string;
  iv: string;
  encryptedPrivateKey: string;
  publicKey: string;
  keyType: KeyType[];
  keyAlgorithm: KeyAlgorithm;
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
}


export interface PresentationDocument extends Models.Document
{
  onwerId: string,
  vcId: string,
  location: string,
  signedBy: KeyDocument
}

// Interface for Organizations Collection
export interface OrganizationDocument extends Models.Document
{
  name: string;
  description?: string
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
  keyId?: string
  name: string
}

export interface CreateKeyDto
{
  salt: string;
  iv: string;
  encryptedPrivateKey: string;
  publicKey: string;
  keyType: KeyType[];
  keyAlgorithm: KeyAlgorithm
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
  memberId: string,
  orgId: string
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

export interface CreateVCDTO
{
  vcData: string,
  // holderId?: string
  identifier: string
  vcId: string
}

export interface CreateVPDTO
{
  vpData: string,
  vcId: string,
  vpId: string
}

export interface CreateVCStoreDTO
{
  vcId: string,
  location: string
  storageType: VCStoreType,
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

export type OrganizationWithRoles = OrganizationDocument & {
  roles: OrganizationRole[]
}

export type MembersWithRoles = UserDocument & {
  roles: OrganizationRole[]
}



class AppwriteService
{
  private client: Client;
  databases: Databases;
  storage: Storage
  constructor()
  {
    this.client = new Client()
      .setEndpoint( conf.appwriteEndpoint )
      .setProject( conf.appwrtieProjectId );

    this.databases = new Databases( this.client );
    this.storage = new Storage( this.client )
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
    const { keyId, ...rest } = didData
    const keys = keyId ? [ keyId ] : []
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

  async getDIDs ( ownerId: string )
  {
    // Fetch related Keys
    const dids = await this.databases.listDocuments<DIDDocument>(
      conf.appwrtieDBId,
      conf.appwriteDIDsCollID,
      [ Query.equal( "owner", ownerId ), Query.select( [ "$id", "$createdAt", "identifier", "name", "keys.$id", "keys.name", "keys.publicKey", "keys.keyAlgorithm", "keys.keyType" ] ), Query.orderDesc( "$id" ) ]
    );
    return dids.documents
  }

  async getDID ( ownerId: string, didId: string )
  {
    // Fetch related Keys
    const dids = await this.databases.getDocument<DIDDocument>(
      conf.appwrtieDBId,
      conf.appwriteDIDsCollID,
      didId,
      [ Query.equal( "owner", ownerId ) ]
    );
    return dids
  }

  async getDIDFromIdentifier ( identifier: string )
  {
    // Fetch related Keys
    const dids = await this.databases.listDocuments<DIDDocument>(
      conf.appwrtieDBId,
      conf.appwriteDIDsCollID,
      [ Query.equal( "identifier", identifier ) ]
    );
    return dids.documents
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
      if ( key.owner.$id !== userId && did.owner.$id !== userId ) throw new Error( "Keys or did is not owned by user" )
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
    console.log( userId, keyData )
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
      [ Query.equal( 'owner', userId ),
      Query.select( [ "$id", "$createdAt", "publicKey", "name", "description", "keyAlgorithm", "keyType", "org.*" ] ),
      Query.orderDesc( "$id" )
      ]
    );
    return keys.documents
  }

  async getKey ( ownerId: string, keyId: string )
  {
    // Fetch related Keys
    const keys = await this.databases.getDocument<KeyDocument>(
      conf.appwrtieDBId,
      conf.appwriteKeysCollID,
      keyId
    );
    return keys
  }

  async deleteKey ( userId: string, id: string )
  {
    const key = await this.getKey( userId, id )
    if ( !key ) throw new Error( "Key doesn't belong to user" )
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
  ): Promise<OrganizationWithRoles>
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
          // owner: userId,
        },
        [
          // Permission.read( Role.users() ),
          // Permission.update( Role.user( userId ) ),
          // Permission.delete( Role.user( userId ) )
        ]
      );
      const ownerRoles = [ OrganizationRole.OWNER, OrganizationRole.MEMBER, OrganizationRole.ADMIN, OrganizationRole.VERIFIER ]
      // link owner to org as owner 
      await this.databases.createDocument<RoleDocument>( conf.appwrtieDBId, conf.appwriteRolesCollID, ID.unique(), { userId, orgId: orgDocument.$id, roles: ownerRoles } )
      return { ...orgDocument, roles: ownerRoles }
    } catch ( error )
    {
      console.error( 'Error creating organization:', error );
      throw error;
    }
  }

  async getOrgnisations ( userId: string ): Promise<OrganizationWithRoles[]>
  {
    const roles = await this.databases.listDocuments<RoleDocument>(
      conf.appwrtieDBId,
      conf.appwriteRolesCollID,
      [ Query.equal( 'userId', userId ) ]
    );
    if ( roles.documents.length < 1 ) return []
    const orgs = await this.databases.listDocuments<OrganizationDocument>(
      conf.appwrtieDBId,
      conf.appwriteOrgsCollID,
      [ Query.equal( '$id', roles.documents.map( ( role ) => role.orgId ) ), Query.orderDesc( "$id" ) ]
    );

    return orgs.documents.map( ( document, i ) => ( { ...document, roles: roles.documents[ i ].roles } ) )
  }

  async getOrgMembers ( orgId: string ): Promise<MembersWithRoles[]>
  {
    const roles = await this.databases.listDocuments<RoleDocument>(
      conf.appwrtieDBId,
      conf.appwriteRolesCollID,
      [ Query.equal( 'orgId', orgId ) ]
    );
    if ( roles.documents.length < 1 ) return []
    const members = await this.databases.listDocuments<UserDocument>(
      conf.appwrtieDBId,
      conf.appwriteUsersCollID,
      [ Query.equal( '$id', roles.documents.map( ( role ) => role.userId ) ), Query.orderDesc( "$id" ) ]
    );
    console.log( members, roles.documents.map( ( role ) => role.userId ) )
    return members.documents.map( ( document, i ) => ( { ...document, roles: roles.documents[ i ].roles } ) )
  }

  async upsertOrganizationMember (
    orgId: string,
    ownerId: string,
    email: string,
    roles: OrganizationRole[] = [ OrganizationRole.MEMBER, OrganizationRole.VERIFIER ]
  ): Promise<void>
  {
    try
    {
      // check if requester owns the ORG
      const rolesDocument = await this.databases.listDocuments<RoleDocument>(
        conf.appwrtieDBId,
        conf.appwriteRolesCollID,
        [ Query.and( [ Query.equal( 'orgId', orgId ), Query.equal( "userId", ownerId ) ] ) ]
      );
      if ( !( rolesDocument.documents.length > 0 && ( rolesDocument.documents[ 0 ].roles.includes( OrganizationRole.OWNER ) || rolesDocument.documents[ 0 ].roles.includes( OrganizationRole.ADMIN ) ) ) ) throw new Error( "U do not have permission to add users to orgnisation" )

      // check if user exists 
      const users = ( await this.databases.listDocuments<UserDocument>( conf.appwrtieDBId, conf.appwriteUsersCollID, [ Query.equal( "email", email ) ] ) ).documents
      if ( users.length < 1 ) throw new Error( "Invalid Email user does not exist" )

      // check if user is already a member
      const userRolesDocument = ( await this.databases.listDocuments<RoleDocument>(
        conf.appwrtieDBId,
        conf.appwriteRolesCollID,
        [ Query.equal( 'orgId', orgId ), Query.equal( "userId", users[ 0 ].$id ) ]
      ) ).documents;
      // create roles
      if ( userRolesDocument.length < 1 )
      {
        await this.databases.createDocument<RoleDocument>( conf.appwrtieDBId, conf.appwriteRolesCollID, ID.unique(), { userId: users[ 0 ].$id, orgId, roles: roles } )
        return
      }
      // create update
      await this.databases.updateDocument<RoleDocument>( conf.appwrtieDBId, conf.appwriteRolesCollID, userRolesDocument[ 0 ].$id, { roles: roles } )
    } catch ( error )
    {
      console.error( 'Error adding organization member:', error );
      throw error;
    }
  }

  async removeOrganizationMember (
    orgId: string,
    ownerId: string,
    userId: string,
  ): Promise<void>
  {
    try
    {
      // check if requester owns the ORG
      const rolesDocument = await this.databases.listDocuments<RoleDocument>(
        conf.appwrtieDBId,
        conf.appwriteRolesCollID,
        [ Query.and( [ Query.equal( 'orgId', orgId ), Query.equal( "userId", ownerId ) ] ) ]
      );
      if ( !( rolesDocument.documents.length > 0 && ( rolesDocument.documents[ 0 ].roles.includes( OrganizationRole.OWNER ) || rolesDocument.documents[ 0 ].roles.includes( OrganizationRole.ADMIN ) ) ) ) throw new Error( "U do not have permission to remove users from orgnisation" )

      // check if user is already a member
      const userRolesDocument = ( await this.databases.listDocuments<RoleDocument>(
        conf.appwrtieDBId,
        conf.appwriteRolesCollID,
        [ Query.and( [ Query.equal( 'orgId', orgId ), Query.equal( "userId", userId ) ] ) ]
      ) ).documents;
      // delete roles document if it exists
      if ( userRolesDocument.length > 0 )
      {
        await this.databases.deleteDocument( conf.appwrtieDBId, conf.appwriteRolesCollID, userRolesDocument[ 0 ].$id )
        return
      }
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
      // check if user owns the key
      const key = await this.databases.getDocument<KeyDocument>(
        conf.appwrtieDBId,
        conf.appwriteKeysCollID,
        keyId
      );

      if ( key.owner.$id !== userId ) throw new Error( "Key Doesn't belong to user" )
      if ( key.org ) throw new Error( "A key can only belong to one orgnisation" )
      // check if user belongs to org
      const roles = ( await this.databases.listDocuments<RoleDocument>(
        conf.appwrtieDBId,
        conf.appwriteRolesCollID,
        [ Query.equal( 'orgId', orgId ), Query.equal( "userId", userId ) ]
      ) ).documents;
      if ( roles.length < 0 ) throw new Error( "User does not belong to the organization" )

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

  async getOrganizationsForKey ( ownerId: string, keyId: string )
  {
    const keys = await this.databases.listDocuments<OrganizationDocument>(
      conf.appwrtieDBId,
      conf.appwriteOrgsCollID,
      [ Query.equal( "owner", ownerId ), Query.equal( "org", keyId ), ]
    );
    return keys.documents
  }

  async getKeysForOrgAndUser ( ownerId: string, orgId: string )
  {
    // Fetch related Keys
    const keys = ( await this.databases.listDocuments<KeyDocument>(
      conf.appwrtieDBId,
      conf.appwriteKeysCollID,
      [ Query.equal( "owner", ownerId ), Query.equal( "org", orgId ), Query.orderDesc( "$id" ) ]
    ) )
    return keys.documents
  }
  async getKeysForOrganization ( orgId: string )
  {
    const keys = await this.databases.listDocuments<KeyDocument>(
      conf.appwrtieDBId,
      conf.appwriteKeysCollID,
      [ Query.equal( "org", orgId ) ]
    );
    return keys.documents
  }

  async issueCredential ( data: CreateVCDTO, orgId: string, memberId: string, keyId: string )
  {
    try
    {
      // Verify that the keyId is authorized for the given organization
      const keyDoc = await this.getKey( memberId, keyId )
      if ( !keyDoc ) throw new Error( "Invalid or unauthorized key for this organization." );

      if ( keyDoc.org.$id !== orgId ) throw new Error( "Key Does not belong to organization." );

      if ( keyDoc.owner.$id !== memberId ) throw new Error( "Key Does not belong to member." );
      // check if DID Holder has an account on HiD
      const did = ( await this.databases.listDocuments<DIDDocument>( conf.appwrtieDBId, conf.appwriteDIDsCollID, [ Query.equal( "identifier", data.identifier ) ] ) ).documents

      let holderId = null
      if ( did.length > 0 )
      {
        if ( did[ 0 ].owner )
        {
          holderId = did[ 0 ].owner.$id
        }
      }
      // Save the VCDocument in the database
      const result = await this.databases.createDocument<VCDocument>(
        conf.appwrtieDBId,
        conf.appwriteVCsCollID,
        data.vcId, // Generate a unique ID
        {
          issuer: orgId,
          holder: holderId,
          signedBy: keyId,
          identifier: data.identifier
        }
      );
      const blob = new Blob( [ data.vcData ], { type: "application/json" } );
      // Create Blob
      // save VCObj to a file and add store type
      const { url } = await this.uploadFile( new File( [ blob ], "vcObj" ) )
      // add VCStore
      await this.databases.createDocument<VCStoreDocument>(
        conf.appwrtieDBId,
        conf.appwriteVCStoresCollID,
        ID.unique(), // Generate a unique ID
        { storageType: VCStoreType.CLOUD, location: url, vcId: result.$id, storedBy: StoredByEnum.ORG }
      );
      return result;
    } catch ( error )
    {
      console.error( "Error issuing credential:", error );
      throw error;
    }
  }

  async issuePresentation ( data: CreateVPDTO, ownerId: string, keyId: string )
  {
    try
    {
      // Verify that the keyId is authorized for the given organization
      const keyDoc = await this.getKey( ownerId, keyId )
      if ( !keyDoc ) throw new Error( "Key does not exist" );

      // if ( keyDoc.owner.$id !== ownerId ) throw new Error( "Key Does not belong to user." );

      const blob = new Blob( [ data.vpData ], { type: "application/json" } );
      // Create Blob
      // save VCObj to a file and add store type
      const { url } = await this.uploadFile( new File( [ blob ], "vpObj" ) )
      // Save the VCDocument in the database
      const result = await this.databases.createDocument<PresentationDocument>(
        conf.appwrtieDBId,
        conf.appwriteVPsCollID,
        data.vpId, // Generate a unique ID
        {
          signedBy: keyId,
          ownerId, location: url,
          vcId: data.vcId
        }
      );
      return result;
    } catch ( error )
    {
      console.error( "Error issuing credential:", error );
      throw error;
    }
  }

  async getPresentationsForOrg ( orgId: string )
  {
    if ( !orgId ) throw new Error( "invalid Request" )
    const result = await this.databases.listDocuments<PresentationDocument>(
      conf.appwrtieDBId,
      conf.appwriteVPsCollID,
      // @ts-ignore
      [ Query.equal( "ownerId", orgId ), Query.orderDesc( "$id" ), Query.select( [ "ownerId", "vcId", "location", "$createdAt", "$id", "signedBy.$id", "signedBy.name", "signedBy.publicKey" ] ) ]
    );
    return result.documents
  }

  async getPresentations ( userId: string )
  {
    if ( !userId ) throw new Error( "invalid Request" )
    const result = await this.databases.listDocuments<PresentationDocument>(
      conf.appwrtieDBId,
      conf.appwriteVPsCollID,
      // @ts-ignore
      [ Query.equal( "ownerId", userId ), Query.orderDesc( "$id" ), Query.select( [ "ownerId", "vcId", "location", "$createdAt", "$id", "signedBy.$id", "signedBy.name", "signedBy.publicKey" ] ) ]
    );
    return result.documents
  }

  async getPresentation ( vpId: string )
  {
    if ( !vpId ) throw new Error( "invalid Request" )
    const result = await this.databases.getDocument<PresentationDocument>(
      conf.appwrtieDBId,
      conf.appwriteVPsCollID,
      vpId
    );
    return result
  }

  async getVCDoc ( vcId: string ): Promise<VCDocument>
  {
    const result = await this.databases.getDocument<VCDocument>(
      conf.appwrtieDBId,
      conf.appwriteVCsCollID,
      vcId
    );
    return result
  }

  async getCredentialsForOrg ( orgId: string, memberId: string ): Promise<VCDocument[]>
  {
    // check if user is a member of org
    // const rolesDocument = ( await this.databases.listDocuments<RoleDocument>(
    //   conf.appwrtieDBId,
    //   conf.appwriteRolesCollID,
    //   [ Query.and( [ Query.equal( 'orgId', orgId ), Query.equal( "userId", memberId ) ] ) ]
    // ) ).documents;
    // if ( rolesDocument.length < 1 ) throw new Error( "Unauthorized." )

    const result = await this.databases.listDocuments<VCDocument>(
      conf.appwrtieDBId,
      conf.appwriteVCsCollID,
      [ Query.equal( "issuer", orgId ), Query.orderDesc( "$id" ), Query.select( [ "$id", "identifier", "$createdAt", "issuer.name", "issuer.$id", "holder.*" ] ) ]
    );
    return result.documents
  }

  async getCredentialsForUser ( userId?: string, identifier?: string ): Promise<VCDocument[]>
  {
    if ( !userId && !identifier ) throw new Error( "invalid Request" )
    const result = await this.databases.listDocuments<VCDocument>(
      conf.appwrtieDBId,
      conf.appwriteVCsCollID,
      // @ts-ignore
      [ identifier ? Query.equal( "identifier", identifier ) : Query.equal( "holder", userId ), Query.orderDesc( "$id" ), Query.select( [ "$id", "identifier", "$createdAt", "issuer.name", "issuer.$id" ] ) ]
    );
    return result.documents
  }

  async getOrgCredentials ( orgId: string ): Promise<VCDocument[]>
  {
    if ( !orgId ) throw new Error( "invalid Request" )
    const identifier = `did:web:675d93dc69da7be75efd.appwrite.global/issuers/${orgId}`
    const result = await this.databases.listDocuments<VCDocument>(
      conf.appwrtieDBId,
      conf.appwriteVCsCollID,
      [ Query.equal( "identifier", identifier ), Query.orderDesc( "$id" ), Query.select( [ "$id", "identifier", "$createdAt", "issuer.name", "issuer.$id" ] ) ]
    );
    return result.documents
  }

  async addStore ( data: CreateVCStoreDTO, storedBy: StoredByEnum, creatorId: string )
  {
    try
    {
      // Ensure the storage type is valid (enum check)
      const validStorageTypes = [ "CLOUD", "IPFS", "HEDERA_TOPIC", "HEDERA_FILE" ];
      if ( !validStorageTypes.includes( data.storageType ) )
      {
        throw new Error( `Invalid storage type: ${data.storageType}` );
      }
      const VC = ( await this.databases.listDocuments<VCDocument>(
        conf.appwrtieDBId,
        conf.appwriteVCsCollID,
        [ Query.equal( '$id', data.vcId ) ]
      ) ).documents;
      if ( VC.length < 1 ) throw new Error( "VC does not exist" )

      if ( storedBy === StoredByEnum.USER )
      {
        if ( VC[ 0 ].holder && VC[ 0 ].holder.$id !== creatorId ) throw new Error( "You are not allowed to add store type" )
      }
      if ( storedBy === StoredByEnum.ORG )
      {
        // check if member belongs to the org
        const roleDocument = ( await this.databases.listDocuments( conf.appwrtieDBId, conf.appwriteRolesCollID, [ Query.and( [ Query.equal( "orgId", VC[ 0 ].issuer.$id ), Query.equal( "userId", creatorId ) ] ) ] ) ).documents
        if ( roleDocument.length < 1 ) throw new Error( "You are not allowed to add store type" )
      }
      // Save the storage location in the database
      const result = await this.databases.createDocument<VCStoreDocument>(
        conf.appwrtieDBId,
        conf.appwriteVCStoresCollID,
        ID.unique(), // Generate a unique ID
        {
          ...data,
          storedBy
        }
      );
      return result;
    } catch ( error )
    {
      console.error( "Error adding storage:", error );
      throw error;
    }
  }


  async uploadFile ( fileData: File )
  {
    const uploadedFile = await this.storage.createFile( conf.appwriteBucketId, ID.unique(), fileData )
    return { uploadedFile, url: `https://cloud.appwrite.io/v1/storage/buckets/${conf.appwriteBucketId}/files/${uploadedFile.$id}/view?project=${conf.appwrtieProjectId}` }
  }

  async listVCContexts (): Promise<{ name: string, url: string }[]>
  {
    const result = await this.databases.listDocuments( conf.appwrtieDBId, conf.appwriteContextsCollID,[Query.orderDesc("$id")] )
    return result.documents as any
  }

  /**
   * Lists all storage locations for a given VC.
   * @param vcId - The VC ID.
   */
  async listVCStores ( vcId: string )
  {
    try
    {
      const result = await this.databases.listDocuments<VCStoreDocument>(
        conf.appwrtieDBId,
        conf.appwriteVCStoresCollID,
        [ Query.equal( "vcId", vcId ) ]
      );

      return result.documents;
    } catch ( error )
    {
      console.error( "Error listing storage locations:", error );
      throw error;
    }
  }
}

export default new AppwriteService();