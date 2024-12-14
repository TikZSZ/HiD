import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useKeyContext } from "@/contexts/keyManagerCtx";
import { useSignModal } from "@/components/app/SignModal"; // The context we just created
import { PrivateKey, PublicKey } from "@hashgraph/sdk";
import { getUserScopedKey, KeyMetadata, KeyPurpose, associateKeyWithDID, KeyPair } from '@/HiD/keyManager';
import { createDidDocument, registerDidDocument } from '@/did';
import { useWallet } from '@/contexts/hashconnect';
import { motion } from "framer-motion";
import { Loader2, XIcon } from "lucide-react";
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
import { PageHeader } from "./PageHeader";

const formSchema = z.object( {
  DIDName: z.string().min( 1, "DID name is required" ),
  selectedKey: z.string().nonempty( "Key selection is required" ),
} );

export const DIDCreatePage: React.FC = () =>
{
  const { useKeysList, useUpsertDID, addAssociation,useDIDsList } = useKeyContext();
  const {data:dids,isLoading} = useDIDsList()
  const {data:keys} = useKeysList()
  const upsertDID = useUpsertDID()
  const { openSignModal } = useSignModal();
  const { getSigner, isConnected } = useWallet();
  const { toast } = useToast();
  const [ isCreating, setIsCreating ] = useState( false );

  const [ isModalOpen, setIsModalOpen ] = useState( false );
  const toggleModal = () => setIsModalOpen( !isModalOpen );

  const form = useForm( {
    resolver: zodResolver( formSchema ),
    defaultValues: { DIDName: "", selectedKey: "" },
  } );

  const handleCreateDID = async ( data: { DIDName: string; selectedKey: string } ) =>
  {
    if ( !isConnected )
    {
      toast( {
        title: "Wallet Not Connected",
        description: "Please connect your wallet before proceeding.",
        variant: "destructive",
      } );
      return;
    }

    const selectedKey = keys && keys.find( ( key ) => key.$id === data.selectedKey );
    if ( !selectedKey ) return;

    setIsCreating( true );

    openSignModal( selectedKey.$id, "key-retrieval", {
      purpose: "DID Creation",
      onSuccess: async ( KeyPair ) =>
      {
        try
        {
          console.log(KeyPair)
          const privateKey = PrivateKey.fromBytesED25519((KeyPair as KeyPair).secretKey)
          const signer = getSigner();
          console.log(signer)
          // @ts-ignore
          let didDocument = createDidDocument( { privateKey: privateKey as PrivateKey, signer: signer! } );
          didDocument = await registerDidDocument( didDocument );

          const did = await upsertDID.mutateAsync( {
            identifier: didDocument.getIdentifier(),
            name: data.DIDName,
          } );

          await addAssociation( "DID", did.$id, selectedKey.$id );

          toast( { title: "Success", description: "DID created successfully!" } );
          toggleModal()
        } catch ( error )
        {
          // @ts-ignore
          toast( { title: "Error", description: "An error occurred while creating the DID." + " " +error.message, variant: "destructive" } );
          console.error( error );
        } finally
        {
          setIsCreating( false );
        }
      },
      onError: ( error ) =>
      {
        console.error( "Signing failed", error );
        setIsCreating( false );
      },
      onClose: () =>
      {
        console.error( "Signing failed", "User Rejected" );
        setIsCreating( false );
      },
    } );
  };
  
  // useEffect(()=>{
  //   getDIDs()
  // },[])

  return (
    <div className="relative h-full p-4 min-h-[90vh]" >
      {/* Full Page Overlay for DID Creation Form */}
      {/* Header */}
      <PageHeader title="DIDs" description="Manage DIDs" onClick={toggleModal} />
      <FormModal title="Create DID" isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit( handleCreateDID )} className="space-y-4">
            {/* DID Name Field */}
            <FormField
              name="DIDName"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel>DID Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a name for the DID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Key Selection Field */}
            <FormField
              name="selectedKey"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel>Select Key</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={( value ) => field.onChange( value )}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a key" />
                      </SelectTrigger>
                      <SelectContent>
                        {keys && keys.map( ( key ) => (
                          <SelectItem key={key.$id} value={key.$id}>
                            {key.name} - {key.$id.slice( 0, 10 )}...
                          </SelectItem>
                        ) )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button variant="outline" onClick={toggleModal} type="reset" >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>{isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}</Button>
            </div>
          </form>
        </Form>
      </FormModal>

      {/* DID List View */}
      <div className=" flex-grow overflow-auto">
        <h3 className="text-lg font-semibold">
          {dids && dids.length > 0 && `Existing DIDs ${dids.length}`}
        </h3>
        {dids && dids.length > 0 ? (
          <div className="space-y-4 mt-6">
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
                        {key.name} - {key.publicKey}
                      </div>
                    ) )}
                  </div>
                </CardContent>
              </Card>
            ) )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground mt-4">No DIDs Found</p>
        )}
      </div>

    </div>
  );
};

export default DIDCreatePage;
