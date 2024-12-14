import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useKeyContext } from "@/contexts/keyManagerCtx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { PublicKey } from "@hashgraph/sdk";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormModal } from "../app/FormModal";
import { PageHeader } from "./PageHeader";
import { Loader2 } from "lucide-react";
import { KeyAlgorithm } from "@/HiD/keyManager";
function getFormmatedPubKey ( publicKey: string )
{
  // const pK = PublicKey.fromString( publicKey ).toStringRaw()
  const pK = publicKey
  return `${pK.slice( 0, 20 )}....${pK.slice( -20 )}`
}
// Validation schema
const keySchema = z.object( {
  keyType: z.nativeEnum( KeyAlgorithm, { required_error: "Key type is required." } ).default( KeyAlgorithm.ED25519 ),
  name: z.string().min( 3, { message: "Name must be at least 3 characters." } ),
  description: z.string().optional(),
  password: z.string().min( 8, { message: "Password must be at least 8 characters." } ),
} );
type KeyFormValues = z.infer<typeof keySchema>;

export const KeyManagementOverlay: React.FC = () =>
{
  const { useKeysList, useGenerateKey, useDeleteKey } = useKeyContext();
  const { data: keys } = useKeysList()
  const generateKey = useGenerateKey()
  const deleteKey = useDeleteKey()
  // Form states
  const [ loading, setLoading ] = useState<boolean>( false );
  const [ isModalOpen, setIsModalOpen ] = useState( false );
  const [ isCreating, setIsCreating ] = useState( false );

  const toggleModal = () => setIsModalOpen( !isModalOpen );

  const handleGenerateKey = async ( { keyType, name, description, password }: KeyFormValues ) =>
  {
    setLoading( true );
    setIsCreating( true )
    try
    {
      await generateKey.mutateAsync( { metadata: { name, description, keyAlgorithm: keyType }, password } );
      toggleModal()
    } catch ( error )
    {
      console.error( "Error generating key:", error );
    } finally
    {
      setLoading( false );
      setIsCreating( false )
    }
  };

  const handleDeleteKey = async ( keyId: string ) =>
  {
    setLoading( true );
    try
    {
      await deleteKey.mutateAsync( keyId );
    } catch ( error )
    {
      console.error( "Error deleting key:", error );
    } finally
    {
      setLoading( false );
    }
  };

  const viewDIDAssociations = async ( keyId: string, didId: string ) =>
  {
    // const associations = getAssociations("DID",didId)
    // console.log(`Associations for DID ${didId}:`, associations);
    // Add code to display associations in a dialog or a dedicated section
  };

  const viewOrgAssociations = async ( keyId: string, orgId: string ) =>
  {
    // const associations = await getAssociations("Organization", orgId);
    // console.log(`Associations for Organization ${orgId}:`, associations);
    // Add code to display associations in a dialog or a dedicated section
  };


  const form = useForm<KeyFormValues>( {
    resolver: zodResolver( keySchema ),
    defaultValues: {
      keyType: undefined,
      name: "",
      description: "",
      password: "",
    },
  } );

  const onSubmit = ( data: KeyFormValues ) =>
  {
    console.log( "Form Submitted:", data );
    handleGenerateKey( data )
  };

  // useEffect(()=>{
  //   listKeys()
  // },[])

  return (
    <div className="relative h-full flex flex-col p-4 min-h-[90vh]">
      {/* Header */}
      <PageHeader title="Key Manager" description="Manage cryptographic keys." onClick={toggleModal} />

      {/* Existing Keys List */}
      <div className="flex-grow overflow-auto">
        <h3 className="text-lg font-semibold">
          {keys && keys.length ? `Existing Keys ${keys.length}` : null}
        </h3>
        {keys && keys.length > 0 ? (
          <ul className="space-y-2 mt-6">
            {keys.map( ( key ) => (
              <li
                key={key.$id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="text-xs text-muted-foreground">{`${getFormmatedPubKey( key.publicKey )}`}</p>
                    <p className="text-sm text-muted-foreground">{key.type}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteKey( key.$id )}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </div>

                {/* Associations */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Associations</h4>
                  <div className="space-y-1">
                    {/* DIDs */}
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground">
                        DIDs:
                      </h5>
                      {key.dids.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {key.dids.map( ( did ) => (
                            <li key={did.$id} className="flex justify-between">
                              <span className="break-all text-sm">{did.identifier.split( "_" )[ 1 ]}-{did.name}</span>

                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => viewDIDAssociations( key.$id, did.$id )}
                              >
                                View Associations
                              </Button>
                            </li>
                          ) )}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground">No associated DIDs</p>
                      )}
                    </div>

                    {/* Organizations */}
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground">
                        Organizations:
                      </h5>
                      {key.org ? (
                        <ul className="list-disc list-inside">
                          {
                            <li key={key.org.$id} className="flex justify-between">
                              <span className="break-all text-sm">{key.org.name}#{`${key.org.$id.substring( 0, 10 )}....`}</span>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => viewOrgAssociations( key.$id, key.$id )}
                              >
                                View Associations
                              </Button>
                            </li>
                          }
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground">No associated organizations</p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ) )}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground mt-4">No keys available.</p>
        )}
      </div>


      {/* Full Page Overlay Form */}
      <FormModal title="Create Key" isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit( onSubmit )} className="space-y-4">
            {/* Key Type */}
            <FormField
              name="keyType"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel>Key Type</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Key Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values( KeyAlgorithm ).map( ( type ) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ) )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Key Name */}
            <FormField
              name="name"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel>Key Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Key Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Key Description */}
            <FormField
              name="description"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel>Key Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Key Description" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              name="password"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel>Encryption Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Encryption Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button variant="outline" onClick={() => setIsModalOpen( false )} type="reset">
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>{isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}</Button>
            </div>
          </form>
        </Form>
      </FormModal>
    </div>
  );
};
export default KeyManagementOverlay