import React, { useState } from "react";
import
  {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
  } from "@/components/ui/dialog"; // Adjust this path based on your structure
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useKeyContext } from "@/contexts/keyManagerCtx";
import { PublicKey } from "@hashgraph/sdk";

interface KeyManagementOverlayProps
{
  open: boolean;
  setOpen: ( value: boolean ) => void;
}
function getFormmatedPubKey(publicKey:string){
  const pK = PublicKey.fromString(publicKey).toStringRaw()
  return `${pK.slice(0,20)}....${pK.slice(-20)}`
}
export const KeyManagementOverlay: React.FC<KeyManagementOverlayProps> = ( { open, setOpen } ) =>
{
  const { keys, generateKey, deleteKey,getAssociations,orgAssociations,didAssociations } = useKeyContext();

  // Form states
  const [ keyType, setKeyType ] = useState<"RSA" | "Ed25519">( "Ed25519" );
  const [ password, setPassword ] = useState<string>( "" );
  const [ metadata, setMetadata ] = useState<{ name: string; description?: string }>( {
    name: "",
    description: "",
  } );
  const [ loading, setLoading ] = useState<boolean>( false );

  const handleGenerateKey = async () =>
  {
    setLoading( true );
    try
    {
      await generateKey( keyType, metadata, password );
      setMetadata( { name: "", description: "" } );
      setPassword( "" );
      setOpen( false ); // Close dialog on success
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

  const viewDIDAssociations = async (keyId: string, didId: string) => {
    // const associations = getAssociations("DID",didId)
    // console.log(`Associations for DID ${didId}:`, associations);
    // Add code to display associations in a dialog or a dedicated section
  };
  
  const viewOrgAssociations = async (keyId: string, orgId: string) => {
    // const associations = await getAssociations("Organization", orgId);
    // console.log(`Associations for Organization ${orgId}:`, associations);
    // Add code to display associations in a dialog or a dedicated section
  };
  

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Keys</DialogTitle>
          <DialogDescription>
            Generate new cryptographic keys, view existing ones, or remove them.
          </DialogDescription>
        </DialogHeader>

        {/* Form for generating keys */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Create New Key</h3>
          <div className="space-y-2">
            <Select onValueChange={( value ) => setKeyType( value as "RSA" | "Ed25519" )} value={keyType}>
              <SelectTrigger>
                <SelectValue placeholder="Select key type" />
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
              onChange={( e ) => setMetadata( { ...metadata, description: e.target.value } )}
            />
            <Input
              type="password"
              placeholder="Encryption Password"
              value={password}
              onChange={( e ) => setPassword( e.target.value )}
            />
          </div>

          <Button onClick={handleGenerateKey} disabled={loading}>
            {loading ? "Generating..." : "Generate Key"}
          </Button>
        </div>

        {/* List of existing keys */}
        {/* <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Existing Keys</h3>
          {keys.length > 0 ? (
            <ul className="space-y-2">
              {keys.map((key) => (
                <li
                  key={key.id}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="text-sm text-muted-foreground">{key.type}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteKey(key.id)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No keys available.</p>
          )}
        </div> */}
        {/* List of existing keys */}
        <div className="mt-6 space-y-4 overflow-auto max-h-[40vh]">
          <h3 className="text-lg font-semibold">
            Existing Keys ({keys.length})
          </h3>
          {keys.length > 0 ? (
            <ul className="space-y-2">
              {keys.map( ( key ) => (
                <li
                  key={key.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <p className="text-xs text-muted-foreground">{`${getFormmatedPubKey(key.publicKey)}`}</p>
                      <p className="text-sm text-muted-foreground">{key.type}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteKey( key.id )}
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
                        {didAssociations[key.id] && didAssociations[key.id].length > 0 ? (
                          <ul className="list-disc list-inside">
                            {didAssociations[key.id].map( ( did ) => (
                              <li key={did} className="flex justify-between">
                                <span>{did}</span>
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => viewDIDAssociations( key.id, did )}
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
                        {orgAssociations[key.id] && orgAssociations[key.id].length > 0 ? (
                          <ul className="list-disc list-inside">
                            {orgAssociations[key.id].map( ( org ) => (
                              <li key={org} className="flex justify-between">
                                <span>{org}</span>
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => viewOrgAssociations( key.id, org )}
                                >
                                  View Associations
                                </Button>
                              </li>
                            ) )}
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


        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen( false )}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
