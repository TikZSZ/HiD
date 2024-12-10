import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useKeyContext } from "@/contexts/keyManagerCtx.2";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { MenuIcon, XIcon } from "lucide-react";
import { PublicKey } from "@hashgraph/sdk";
import
  {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogHeader,
    DialogFooter,
  } from "@/components/ui/dialog";
function getFormmatedPubKey ( publicKey: string )
{
  const pK = PublicKey.fromString( publicKey ).toStringRaw()
  return `${pK.slice( 0, 20 )}....${pK.slice( -20 )}`
}
export const KeyManagementOverlay: React.FC = () =>
{
  const { keys, generateKey, deleteKey } = useKeyContext();

  // Form states
  const [ keyType, setKeyType ] = useState<"RSA" | "Ed25519">( "Ed25519" );
  const [ password, setPassword ] = useState<string>( "" );
  const [ metadata, setMetadata ] = useState<{ name: string; description?: string }>( {
    name: "",
    description: "",
  } );
  const [ loading, setLoading ] = useState<boolean>( false );
  const [ isModalOpen, setIsModalOpen ] = useState( false );
  const toggleModal = () => setIsModalOpen( !isModalOpen );

  const handleGenerateKey = async () =>
  {
    setLoading( true );
    try
    {
      await generateKey( keyType, metadata, password );
      setMetadata( { name: "", description: "" } );
      setPassword( "" );
      setShowForm( false ); // Close the form after generation
    } catch ( error )
    {
      console.error( "Error generating key:", error );
    } finally
    {
      setLoading( false );
    }
  };

  const handleDeleteKey = async ( keyId: string ) =>
  {
    setLoading( true );
    try
    {
      await deleteKey( keyId );
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

  const [ showForm, setShowForm ] = useState( false );

  const formRef = useRef<HTMLDivElement>( null );

  return (
    <div className="relative h-full flex flex-col p-4 min-h-[90vh]">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold">Key Manager</h3>
        <p className="text-sm text-muted-foreground">Manage cryptographic keys.</p>
      </div>

      {/* Existing Keys List */}
      <div className="mt-6 space-y-4 overflow-auto">
        <h3 className="text-lg font-semibold">
          Existing Keys ({keys.length})
        </h3>
        {keys.length > 0 ? (
          <ul className="space-y-2">
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
                              <span>{key.$id}</span>
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
          <p className="text-sm text-muted-foreground">No keys available.</p>
        )}
      </div>

      {/* Floating Button to Open Form */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center">
        <Button onClick={() => toggleModal()} className="w-[90%] max-w-sm">
          Generate New Key
        </Button>
      </div>

      {/* Full Page Overlay Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent aria-describedby="Key Creation Form">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              onValueChange={( value ) => setKeyType( value as "RSA" | "Ed25519" )}
              value={keyType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Key Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ed25519">Ed25519</SelectItem>
                <SelectItem value="RSA">RSA</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Key Name"
              value={metadata.name}
              onChange={( e ) => setMetadata( { ...metadata, name: e.target.value } )}
            />
            <Textarea
              placeholder="Key Description (optional)"
              value={metadata.description}
              onChange={( e ) =>
                setMetadata( { ...metadata, description: e.target.value } )
              }
            />
            <Input
              type="password"
              placeholder="Encryption Password"
              value={password}
              onChange={( e ) => setPassword( e.target.value )}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={toggleModal}>
              Cancel
            </Button>
            <Button onClick={handleGenerateKey}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default KeyManagementOverlay