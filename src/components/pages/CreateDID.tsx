import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import
{
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useKeyContext } from "@/contexts/keyManagerCtx";
import { useSignModal } from "@/components/app/SignModal"; // The context we just created
import { PrivateKey, PublicKey } from "@hashgraph/sdk";
import { getUserScopedKey, KeyMetadata, KeyPurpose, upsertDIDKeyAssociation } from '@/HiD/keyManager';
import { createDidDocument, registerDidDocument } from '@/did';
import { useWallet } from '@/contexts/hashconnect';
import { IDID } from '@/HiD/db';

export const DIDCreatePage: React.FC = () =>
{
  const { keys, userId, addAssociation,upsertDID } = useKeyContext();
  const { openSignModal } = useSignModal();
  const { toast } = useToast();
  const { getSigner, isConnected } = useWallet()
  // State for selected key
  const [ selectedKey, setSelectedKey ] = useState<KeyMetadata | null>( null );

  // State to track DID creation process
  const [ isCreating, setIsCreating ] = useState( false );

  // Handle DID creation
  const handleCreateDID = async () =>
  {
    if ( !selectedKey || !isConnected )
    {
      toast( {
        title: isConnected ? "Key Selection Required" : "Wallet Not Connected",
        description: isConnected ? "Please select a key to create a DID" : "Please Connect Wallet",
        variant: "destructive"
      } );
      return;
    }

    setIsCreating( true );

    openSignModal(
      selectedKey!.id,
      "key-retrieval",
      {
        purpose: 'DID Creation',
        onSuccess: async ( privateKey ) =>
        {
          // Handle successful signature
          console.log( 'Key successfully', privateKey );
          await createDid( privateKey as PrivateKey )
        },
        onError: ( error ) =>
        {
          // Handle signature error
          console.error( 'Signing failed', error );
        }
      }
    );
  };

  async function createDid ( privateKey: PrivateKey )
  {
    try
    {
      // Generate DID
      // const did = generateDID(selectedKey.publicKey);
      const signer = getSigner()
      // @ts-ignore
      let didDocument = createDidDocument( { privateKey: privateKey, signer: signer! } )
      console.log( signer )
      didDocument = await registerDidDocument( didDocument )
      console.log( didDocument.getIdentifier() )
      const id = crypto.randomUUID()
      // Prepare DID object
      const didObject: IDID = {
        id: id,
        identifier: didDocument.getIdentifier(),
        publicKey: selectedKey!.publicKey,
        keyId: getUserScopedKey( userId, selectedKey!.id )
      };

      await upsertDID( didObject )
      await addAssociation( 'DID', { didId: id, keyId: selectedKey!.id, purposes: [ KeyPurpose.AUTHENTICATION, KeyPurpose.ASSERTION ], isPrimary: true } )
      // Open sign modal to confirm DID creation
    } catch ( error )
    {
      // Handle general errors
      toast( {
        title: "DID Creation Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      } );
      console.error( error );
      setIsCreating( false );
    }
  }

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Create Decentralized Identifier (DID)</CardTitle>
      </CardHeader>
      <CardContent>
        {keys && keys.length > 0 ? ( <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Key for DID
            </label>
            <Select
              onValueChange={( keyId ) =>
              {
                const key = keys.find( k => k.id === keyId );
                setSelectedKey( key! );
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a key" />
              </SelectTrigger>
              <SelectContent>
                {keys.map( ( key ) => (
                  <SelectItem key={key.id} value={key.id}>
                    {key.name} - {key.id.slice( 0, 10 )}...
                  </SelectItem>
                ) )}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCreateDID}
            disabled={!selectedKey || isCreating}
            className="w-full"
          >
            {isCreating ? "Creating DID..." : "Create DID"}
          </Button>

          {selectedKey && (
            <div className="mt-4 p-3 bg-secondary rounded-lg">
              <p className="text-sm">
                <strong>Selected Key:</strong> {selectedKey.name}
              </p>
              <p className="text-xs text-muted-foreground break-words">
                Public Key: {PublicKey.fromString(selectedKey.publicKey).toStringRaw()}
              </p>
            </div>
          )}
        </div> ) : ( <div>No Keys Found</div> )}
      </CardContent>
    </Card>
  );
};

export default DIDCreatePage;