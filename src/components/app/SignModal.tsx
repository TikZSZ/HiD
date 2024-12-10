import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useKeyContext } from "@/contexts/keyManagerCtx.2";
import { PrivateKey } from "@hashgraph/sdk";
import * as Dialog from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import
{
  ShieldCheck,
  Key as KeyIcon,
  Calendar,
  User
} from "lucide-react";
import { KeyMetadata } from '@/HiD/keyManager';

// Enhanced types to support multiple use cases
type ModalMode = 'signature' | 'key-retrieval';

interface SignModalContextType
{
  openSignModal: (
    keyId: string,
    mode: ModalMode,
    options?: {
      signData?: string,
      purpose?: string,
      onSuccess?: ( result: Uint8Array | PrivateKey ) => void,
      onError?: ( error: Error ) => void,
      onClose?: () => void;
    }
  ) => void;
}

export interface SignModalProps
{
  open: boolean;
  setOpen: ( open: boolean ) => void;
  keyId: string;
  mode: ModalMode;
  signData?: string;
  purpose?: string;
  onSuccess?: ( result: Uint8Array | PrivateKey ) => void;
  onError?: ( error: Error ) => void;
  onClose?: () => void;
}

// Create the context
const SignModalContext = createContext<SignModalContextType | undefined>( undefined );
interface KeyMetadataDisplayProps
{
  keyMetadata: KeyMetadata;
  mode: 'signature' | 'key-retrieval';
  purpose?: string;
}

const KeyMetadataDisplay: React.FC<KeyMetadataDisplayProps> = ( {
  keyMetadata,
  mode,
  purpose
} ) =>
{
  // Format date helper
  const formatDate = ( dateString: string ) =>
  {
    return new Date( dateString ).toLocaleDateString( 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    } );
  };

  return (
    <Card className="w-full border-2 border-secondary/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          {mode === 'signature' ? (
            <>
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              <span>Signing Data</span>
            </>
          ) : (
            <>
              <KeyIcon className="h-5 w-5 text-green-500" />
              <span>Key Retrieval</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {mode === 'signature' && (
          <div className="bg-secondary/50 p-3 rounded-lg">
            <p className="font-medium mb-1">Purpose:</p>
            <p className="text-muted-foreground">{purpose || 'No specific purpose provided'}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Key Name:</span>
          </div>
          <span>{keyMetadata.name || 'Unnamed Key'}</span>

          <div className="flex items-center space-x-2">
            <KeyIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Key Index:</span>
          </div>
          <span>{keyMetadata.$id}</span>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Created:</span>
          </div>
          <span>{formatDate( keyMetadata.$createdAt )}</span>
        </div>

        <div className="bg-secondary/50 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground break-words">
            <strong>Public Key:</strong>
            {keyMetadata.publicKey.slice( 0, 20 )}...{keyMetadata.publicKey.slice( -20 )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
// SignModal Component
const SignModal: React.FC<SignModalProps> = ( {
  open,
  setOpen,
  keyId,
  mode,
  signData,
  purpose,
  onSuccess,
  onError,
  onClose
} ) =>
{
  const { retrieveKey, keys } = useKeyContext();
  const { toast } = useToast();
  const [ password, setPassword ] = useState<string>( "" );
  const [ loading, setLoading ] = useState<boolean>( false );
  const [ keyMetadata, setKeyMetadata ] = useState<KeyMetadata>()

  useEffect( () =>
  {
    const keyMeta = keys.find( ( keyMeta ) => keyMeta.$id === keyId )
    if(!keyMeta && keyId){
      toast( {
        title: "Key Not Found",
        description: `No Keys found for selected keyID ${keyId}`,
        variant: "destructive"
      } );
      return
    }
    setKeyMetadata(keyMeta)
    
  }, [ keyId ] )

  const handleAction = async () =>
  {
    setLoading( true );
    try
    {
      // Retrieve the private key
      const keyResult = await retrieveKey( keyId, password );

      if ( mode === 'key-retrieval' )
      {
        // If mode is key retrieval, return the private key
        toast( {
          title: "Key Retrieved",
          description: "Private key successfully retrieved.",
          variant: "default"
        } );

        onSuccess?.( keyResult.privateKey );
        setOpen( false );
        return;
      }

      // Signature mode
      if ( !signData )
      {
        throw new Error( "No data provided for signing" );
      }

      const encoder = new TextEncoder();
      const encodedData = encoder.encode( signData );

      // Sign the data
      const signature = keyResult.privateKey.sign( encodedData );

      // Verify the signature
      const isValid = keyResult.publicKey.verify( encodedData, signature );

      if ( !isValid )
      {
        throw new Error( "Signature verification failed" );
      }

      // Show success toast
      toast( {
        title: "Signature Successful",
        description: "The data has been successfully signed.",
        variant: "default"
      } );

      // Call onSuccess callback
      onSuccess?.( signature );

      // Close the modal
      setOpen( false );
    } catch ( err )
    {
      // Show error toast
      toast( {
        title: mode === 'signature' ? "Signature Failed" : "Key Retrieval Failed",
        description: err instanceof Error ? err.message : "Operation failed",
        variant: "destructive"
      } );

      // Call onError callback
      onError?.( err instanceof Error ? err : new Error( "Unknown error" ) );
    } finally
    {
      setLoading( false );
    }
  };

  // Reset form when modal closes
  React.useEffect( () =>
  {
    if ( !open )
    {
      setPassword( "" );
    }
  }, [ open ] );

  return (
    <Dialog.Dialog open={open} onOpenChange={setOpen}>
      <Dialog.DialogContent className="max-w-lg p-6">
        <Dialog.DialogTitle className="text-lg font-semibold">
          {mode === 'signature'
            ? `Sign Data for ${purpose}`
            : 'Retrieve Private Key'
          }
        </Dialog.DialogTitle>
        <Dialog.DialogDescription className="mt-2 text-sm text-muted-foreground">
          {/* {mode === 'signature'
            ? `You are about to sign some data for the following purpose: ${purpose}`
            : `Enter your password to retrieve the private key ${keyMetadata?.name}`
          } */}
          
        </Dialog.DialogDescription>
        {keyMetadata && (
            <div className="mt-4">
              <KeyMetadataDisplay
                keyMetadata={keyMetadata}
                mode={mode}
                purpose={purpose}
              />
            </div>
          )}
        {mode === 'signature' && (
          <div className="mt-4 p-4 bg-secondary rounded-lg">
            <p className="text-sm font-medium">Data to be signed:</p>
            <pre className="text-xs mt-2 text-muted-foreground break-words">{signData}</pre>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <Input
            type="password"
            // label="Enter Password"
            placeholder="Your password"
            value={password}
            onChange={( e ) => setPassword( e.target.value )}
            disabled={loading}
            autoFocus
          />

          <div className="flex justify-end space-x-4 mt-4">
            <Button
              variant="secondary"
              onClick={() => {setOpen( false ); onClose?.()}}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={loading || !password}
            >
              {loading
                ? ( mode === 'signature' ? "Signing..." : "Retrieving..." )
                : ( mode === 'signature' ? "Sign" : "Retrieve" )
              }
            </Button>
          </div>
        </div>
      </Dialog.DialogContent>
    </Dialog.Dialog>
  );
};

// Provider Component
export const SignModalProvider: React.FC<{ children: React.ReactNode }> = ( { children } ) =>
{
  const [ isOpen, setIsOpen ] = useState( false );
  const [ modalProps, setModalProps ] = useState<Omit<SignModalProps, 'open' | 'setOpen'>>( {
    keyId: '',
    mode: 'signature',
  } );

  const openSignModal = useCallback( (
    keyId: string,
    mode: ModalMode,
    options?: {
      signData?: string,
      purpose?: string,
      onSuccess?: ( result: Uint8Array | PrivateKey ) => void,
      onError?: ( error: Error ) => void
      onClose?: () => void;
    }
  ) =>
  {
    setModalProps( {
      keyId,
      mode,
      ...options
    } );
    setIsOpen( true );
  }, [] );

  return (
    <SignModalContext.Provider value={{ openSignModal }}>
      {children}
      <SignModal
        open={isOpen}
        setOpen={setIsOpen}
        {...modalProps}
      />
    </SignModalContext.Provider>
  );
};

// Custom hook to use the SignModal context
export const useSignModal = () =>
{
  const context = useContext( SignModalContext );
  if ( !context )
  {
    throw new Error( 'useSignModal must be used within a SignModalProvider' );
  }
  return context;
};

export default SignModal;