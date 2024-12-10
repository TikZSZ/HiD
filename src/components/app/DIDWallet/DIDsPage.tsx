import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useKeyContext } from "@/contexts/keyManagerCtx.2";
import { useSignModal } from "@/components/app/SignModal"; // The context we just created
import { PrivateKey, PublicKey } from "@hashgraph/sdk";
import { getUserScopedKey, KeyMetadata, KeyPurpose, associateKeyWithDID } from '@/HiD/keyManager';
import { createDidDocument, registerDidDocument } from '@/did';
import { useWallet } from '@/contexts/hashconnect';
import { motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import
{
  DialogFooter,
} from "@/components/ui/dialog";
import { FormModal } from "@/components/app/FormModal";
import { PlusIcon } from "lucide-react";

export const DIDCreatePage: React.FC = () =>
{
  const { keys, userId, addAssociation, upsertDID, dids } = useKeyContext();
  const { openSignModal } = useSignModal();
  const { toast } = useToast();
  const { getSigner, isConnected } = useWallet();
  const [ showForm, setShowForm ] = useState( false );

  const formRef = useRef<HTMLDivElement>( null );
  const [ selectedKey, setSelectedKey ] = useState<KeyMetadata | null>( null );
  const [ isCreating, setIsCreating ] = useState( false );
  const [ DIDName, setDIDName ] = useState( "" );
  const [ isModalOpen, setIsModalOpen ] = useState( false );
  const toggleModal = () => setIsModalOpen( !isModalOpen );
  // Handle DID creation
  const handleCreateDID = async () =>
  {
    if ( !selectedKey || !isConnected )
    {
      toast( {
        title: isConnected ? "Key Selection Required" : "Wallet Not Connected",
        description: isConnected ? "Please select a key to create a DID" : "Please Connect Wallet",
        variant: "destructive",
      } );
      return;
    }

    setIsCreating( true );

    openSignModal(
      selectedKey!.$id,
      "key-retrieval",
      {
        purpose: "DID Creation",
        onSuccess: async ( privateKey ) =>
        {
          // Handle successful signature
          console.log( "Key successfully", privateKey );
          await createDid( privateKey as PrivateKey );
        },
        onError: ( error ) =>
        {
          // Handle signature error
          console.error( "Signing failed", error );
          setIsCreating( false );
        },
        onClose ()
        {
          setIsCreating( false );
        },
      }
    );
  };

  async function createDid ( privateKey: PrivateKey )
  {
    c

    try
    {
      const signer = getSigner();
      //@ts-ignore
      let didDocument = createDidDocument( { privateKey: privateKey, signer: signer! } );
      didDocument = await registerDidDocument( didDocument );
      const did = await upsertDID( { identifier: didDocument.getIdentifier(), name: DIDName } );
      await addAssociation( "DID", did.$id, selectedKey!.$id );
      toast( {
        title: "Success",
        description: "DID Created Successfully",
      } );
      setShowForm( false )
    } catch ( error )
    {
      toast( {
        title: "DID Creation Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      } );
      console.error( error );
      setIsCreating( false );
    }
    setIsCreating( false );
  }

  return (
    <div className="relative h-full p-4 min-h-[90vh]" >
      {/* Full Page Overlay for DID Creation Form */}
      {/* Header */}
      <div className="flex justify-between items-center py-4">
        <h3 className="text-lg font-bold">DIDs</h3>
        <p className="text-sm text-muted-foreground">Manage DIDs</p>
        <Button onClick={toggleModal} className="flex items-center">
          <PlusIcon className="mr-2 h-4 w-4" />
          Create DID
        </Button>
      </div>

      {showForm && (
        <motion.div
          ref={formRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
        >
          <div className="relative w-full max-w-lg bg-background p-6 rounded-lg shadow-lg">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowForm( false )}
              className='absolute top-4 right-4'
            >
              <XIcon className="h-5 w-5" />
            </Button>
            <h4 className="text-lg font-semibold mb-4">Create Decentralized Identifier (DID)</h4>
            <div className="space-y-4">
              {keys && keys.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name For DID</label>
                    <Input
                      onChange={( e ) => setDIDName( e.target.value )}
                      placeholder="DID Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Key for DID</label>
                    <Select
                      onValueChange={( keyId ) =>
                      {
                        const key = keys.find( ( k ) => k.$id === keyId );
                        setSelectedKey( key! );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a key" />
                      </SelectTrigger>
                      <SelectContent>
                        {keys.map( ( key ) => (
                          <SelectItem key={key.$id} value={key.$id}>
                            {key.name} - {key.$id.slice( 0, 10 )}...
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
                </div>
              ) : (
                <div>No Keys Found</div>
              )}

              {selectedKey && (
                <div className="mt-4 p-3 bg-secondary rounded-lg">
                  <p className="text-sm">
                    <strong>Selected Key:</strong> {selectedKey.name}
                  </p>
                  <p className="text-xs text-muted-foreground break-words">
                    Public Key: {PublicKey.fromString( selectedKey.publicKey ).toStringRaw()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Floating Button to Open Form */}
      {/* <div className="fixed bottom-4 left-0 right-0 flex justify-center">
        <Button onClick={() => setShowForm( true )} className="w-[90%] max-w-sm">
          Create New DID
        </Button>
      </div> */}


      {/* DID List View */}
      <div className="">
        <h4 className="text-lg font-semibold mb-4">Existing DIDs</h4>
        {dids && dids.length > 0 ? (
          <div className="space-y-4">
            {dids.map( ( did ) => (
              <Card key={did.identifier} className="p-4 bg-card rounded-md shadow-md">
                <CardHeader>
                  <CardTitle>{did.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">Identifier: {did.identifier}</p>
                  <div className="mt-2">
                    <h5 className="text-sm font-semibold">Keys:</h5>
                    {did.keys && did.keys.length > 0 && did.keys.map( ( key ) => (
                      <div key={key.publicKey} className="text-xs text-muted-foreground">
                        {key.name} - {PublicKey.fromString( key.publicKey ).toStringRaw()}
                      </div>
                    ) )}
                  </div>
                </CardContent>
              </Card>
            ) )}
          </div>
        ) : (
          <div>No DIDs Found</div>
        )}
      </div>

    </div>
  );
};

export default DIDCreatePage;
