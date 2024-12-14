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
interface KeyContextType {
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

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    },
  },
});

// Initial context
const KeyContext = createContext<KeyContextType | undefined>(undefined);

// Provider component
export const KeyProvider: React.FC<{ userId: string, children: React.ReactElement }> = ({ userId, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Wallet Manager methods
  const openDIDWalletManager = () => setIsOpen(true);
  const closeDIDWalletManager = () => setIsOpen(false);

  // Existing methods that don't change much
  const retrieveKey = async (id: string, password: string) => {
    return KeyManager.retrieveKey(userId, id, password);
  };

  const addAssociation = async (type: 'DID' | 'Organization', toId: string, withId: string) => {
    if (type === 'DID') {
      await KeyManager.associateKeyWithDID(userId, toId, withId);
    } else {
      await KeyManager.linkOrganizationKey(userId, toId, withId);
    }
    // Invalidate and refetch relevant queries
    queryClient.invalidateQueries({ queryKey: ['keys', userId] });
  };

  const deleteAssociation = async (type: 'DID' | 'Organization', id: string, keyId: string) => {
    // Implementation left as before, or you can add specific logic
  };

  // Custom hooks for data fetching and mutations
  const useKeysList = () => {
    return useQuery({
      queryKey: ['keys', userId],
      queryFn: () => KeyManager.listKeys(userId),
      enabled: !!userId,
    });
  };

  const useDIDsList = () => {
    return useQuery({
      queryKey: ['dids', userId],
      queryFn: () => KeyManager.getDIDs(userId),
      enabled: !!userId,
    });
  };

  const useOrgsList = () => {
    return useQuery({
      queryKey: ['orgs', userId],
      queryFn: () => AppwriteService.getOrgnisations(userId),
      enabled: !!userId,
    });
  };

  const useGenerateKey = () => {
    return useMutation({
      mutationFn: ({ metadata, password }: {
        metadata: Omit<KeyManager.OmmitedKeyMeta, "keyType">,
        password: string
      }) => {
        console.log(metadata,password)
        // // v1
        // if (type === KeyManager.KeyAlgorithm.RSA_4096) {
        //   return KeyManager.generateRSAKey(userId, password, {
        //     ...metadata,
        //     keyType: [KeyType.ENCRYPTION,KeyType.SIGNING],
        //     keyAlgorithm:type
        //   });
        // }
        // // else if (type === KeyManager.KeyAlgorithm.ED25519){
        // //   return KeyManager.generateEd25519Key(userId, password, {
        // //     ...metadata,
        // //     keyType: [KeyType.SIGNING],
        // //     keyAlgorithm:type
        // //   });
        // // }
        // // else {
          
        // // }
        // return KeyManager.generateEd25519Key(userId, password, {
        //   ...metadata,
        //   keyType: [KeyType.SIGNING],
        //   keyAlgorithm:type
        // });
        // // v1
        return KeyManager.generateKey(userId,password,metadata)
      },
      onSuccess: () => {
        // Invalidate and refetch keys after successful generation
        queryClient.invalidateQueries({ queryKey: ['keys', userId] });
      }
    });
  };

  const useDeleteKey = () => {
    return useMutation({
      mutationFn: (keyId: string) => KeyManager.deleteKey(userId, keyId),
      onSuccess: () => {
        // Invalidate and refetch keys after successful deletion
        queryClient.invalidateQueries({ queryKey: ['keys', userId] });
      }
    });
  };

  const useUpsertOrg = () => {
    return useMutation({
      mutationFn: (data: CreateOrganizationDto) => 
        AppwriteService.createOrganization(userId, data),
      onSuccess: (newOrg) => {
        // Update the orgs query cache
        queryClient.setQueryData(['orgs', userId], (oldData: OrganizationWithRoles[] = []) => [
          ...oldData,
          newOrg
        ]);
      }
    });
  };

  const useUpsertDID = () => {
    return useMutation({
      mutationFn: (did: CreateDIDDto) => 
        KeyManager.upsertDID(userId, did),
      onSuccess: (newDID) => {
        // Update the DIDs query cache
        queryClient.setQueryData(['dids', userId], (oldData: DIDDocument[] = []) => [
          ...oldData,
          newDID
        ]);
      }
    });
  };

  return (
    <KeyContext.Provider value={{
      userId,
      // keys: useKeysList().data || [],
      // dids: useDIDsList().data || [],
      // orgs: useOrgsList().data || [],
      isOpen,
      setIsOpen,
      
      // Expose query hooks
      useKeysList,
      useDIDsList,
      useOrgsList,
      
      // Expose mutation hooks
      useGenerateKey,
      useDeleteKey,
      useUpsertOrg,
      useUpsertDID,
      
      // Existing methods
      openDIDWalletManager,
      closeDIDWalletManager,
      retrieveKey,
      addAssociation,
      deleteAssociation
    }}>
      {children}
    </KeyContext.Provider>
  );
};

// Wrapper component to provide QueryClient
export const KeyProviderWrapper: React.FC<{ 
  userId: string, 
  children: React.ReactElement 
}> = ({ userId, children }) => (
  <QueryClientProvider client={queryClient}>
    <KeyProvider userId={userId}>
      {children}
    </KeyProvider>
  </QueryClientProvider>
);

// Hook to use the context
export const useKeyContext = () => {
  const context = useContext(KeyContext);
  if (!context) throw new Error('KeyContext must be used within a KeyProvider');
  return context;
};