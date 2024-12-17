import React, { createContext, useContext, useState } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  QueryClient, 
  QueryClientProvider ,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query';
import * as KeyManager from '@/HiD/keyManager';
import { PrivateKey, PublicKey } from '@hashgraph/sdk';
import AppwriteService, {
  DIDDocument,
  OrganizationDocument,
  KeyDocument,
  CreateDIDDto, 
  KeyType, 
  CreateOrganizationDto,
  OrganizationWithRoles
} from "@/HiD/appwrite/service";
// Types for context
export interface KeyContextType {
  userId: string;
  // keys: KeyDocument[];
  // dids: DIDDocument[];
  // orgs: OrganizationWithRoles[];
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  
  // Query hooks for downstream components
  useKeysList: () => UseQueryResult<KeyDocument[]>;
  
  useDIDsList: () => UseQueryResult<DIDDocument[]>;
  
  useOrgsList: () => UseQueryResult<OrganizationWithRoles[]>;
  
  // Mutation hooks
  useGenerateKey: () => UseMutationResult<KeyManager.KeyMetadata, Error, {
    metadata: Omit<KeyManager.OmmitedKeyMeta, "keyType">;
    password: string;
}, unknown>
  
  useDeleteKey: () => UseMutationResult<void, Error, string, unknown>
  
  useUpsertOrg: () => UseMutationResult<OrganizationWithRoles, Error, CreateOrganizationDto, unknown>
  
  useUpsertDID: () => UseMutationResult<DIDDocument, Error, CreateDIDDto, unknown>;
  
  // Existing methods
  openDIDWalletManager: () => void;
  closeDIDWalletManager: () => void;
  retrieveKey: (id: string, password: string) => Promise<{ publicKey: string, privateKey: string, keyPair:KeyManager.KeyPair }>;
  addAssociation: (type: 'DID' | 'Organization', toId: string, withId: string) => Promise<void>;
  deleteAssociation: (type: 'DID' | 'Organization', id: string, keyId: string) => Promise<void>;
}


// Initial context
export const KeyContext = createContext<KeyContextType | undefined>(undefined);



// Hook to use the context
export const useKeyContext = () => {
  const context = useContext(KeyContext);
  if (!context) throw new Error('KeyContext must be used within a KeyProvider');
  return context;
};