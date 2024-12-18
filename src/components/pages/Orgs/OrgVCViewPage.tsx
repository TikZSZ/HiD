import React, { useState } from 'react';
import
{
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import
{
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import
{
  ShieldCheck,
  Copy,
  FileSignature,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCircle2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useParams } from 'react-router-dom';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import
{
  createDiscloseCryptosuite,
  createVerifyCryptosuite
} from "@digitalbazaar/bbs-2023-cryptosuite"
import { klona } from 'klona';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import jsigs from 'jsonld-signatures';
import * as vc from '@digitalbazaar/vc';
import { documentLoader } from "@/HiD/jsonld-contexts";
import { cryptosuite as eddsaRdfc2022CryptoSuite } from
  '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppwriteService, { KeyAlgorithm, KeyDocument, VCStoreDocument } from '@/HiD/appwrite/service';
import { useKeyContext } from '@/contexts/keyManagerCtx';
import { useSignModal } from '@/components/app/SignModal';
import { keyTypesColors } from '@/components/OrganizationTable';
import ErrorComponent from '@/components/ErrorComponent';
import { ID } from 'appwrite';
const { purposes: { AssertionProofPurpose } } = jsigs;

export const OrganizationVCViewPage: React.FC = () =>
{
  const { vcId, orgId } = useParams<{ vcId: string, orgId: string }>();
  const { userId } = useKeyContext();
  const { openSignModal } = useSignModal();
  const queryClient = useQueryClient();

  // State for Verifiable Presentation
  const [ isVPDialogOpen, setIsVPDialogOpen ] = useState( false );
  const [ selectedFields, setSelectedFields ] = useState<string[]>( [] );
  const [ selectedKey, setSelectedKey ] = useState<string>();
  const [ isCreating, setIsCreating ] = useState( false );

  // Fetch VC Stores
  const {
    data: vcStores = [],
    isLoading: isLoadingStores
  } = useQuery<VCStoreDocument[]>( {
    queryKey: [ 'orgVCStores', vcId ],
    queryFn: () => vcId ? AppwriteService.listVCStores( vcId ) : Promise.resolve( [] ),
    enabled: !!vcId,
  } );

  // Fetch VC Data
  const {
    data: vcData,
    isLoading: isLoadingVC,
    error
  } = useQuery<{
    signedCredential: {
      id: string;
      type: string[];
      issuer: {
        id: string;
        name: string;
      };
      issuanceDate: string;
      validUntil?: string
      credentialSubject: Record<string, any> & { id: string };
      proof: {
        type: string;
        cryptosuite: string;
      };
    };
    contextMetadata: Record<string, {
      name: string;
      mandatory: boolean;
      type: string;
      description: string;
    }>;
  }>( {
    queryKey: [ 'orgVCData', vcId ],
    queryFn: async () => vcStores.length > 0 && ( await fetch( vcStores[ 0 ].location ) ).json(),
    enabled: ( vcStores.length > 0 ),
  } );

  // Fetch DID for the Credential Subject
  const didIdentifier = vcData?.signedCredential.credentialSubject.id;
  const {
    data: keys = [],
    isLoading: isLoadingKeys,
    refetch: refetchKeys
  } = useQuery<KeyDocument[]>( {
    queryKey: [ 'orgKeys', orgId ],
    queryFn: () => AppwriteService.getKeysForOrgAndUser( userId, orgId! ),
    enabled: !!orgId,
  } );

  // Fetch Available Keys for VP Creation
  const availableKeys = keys && keys.length > 0 ? ( keys.filter(
    ( key ) => key.keyAlgorithm === KeyAlgorithm.ED25519
  ) ) : []

  if ( error )
  {
    return <div>{error.message}</div>;
  }

  const copyToClipboard = ( text: string ) =>
  {
    navigator.clipboard.writeText( text );
    toast( {
      title: "Copied to Clipboard",
      description: "The value has been copied successfully.",
    } );
  };

  const renderFieldValue = ( key: string, value: any ) =>
  {
    const metadata = vcData?.contextMetadata[ key ];

    switch ( metadata?.type )
    {
      case 'date':
        return format( new Date( value ), 'PPP' );
      case 'number':
        return value.toLocaleString();
      default:
        return value;
    }
  };

  // Handle field selection for VP
  const handleFieldSelection = ( fieldKey: string ) =>
  {
    setSelectedFields( prev =>
      prev.includes( fieldKey )
        ? prev.filter( f => f !== fieldKey )
        : [ ...prev, fieldKey ]
    );
  };

  // Create Verifiable Presentation
  const handleCreateVP = async () =>
  {
    setIsCreating( true );
    if ( !selectedKey || !vcId || !vcData )
    {
      toast( { title: "Invalid Selection" } );
      setIsCreating( false );
      return;
    }

    // Extract mandatory fields
    const mandatoryFields = Object.entries( vcData.contextMetadata )
      .filter( ( [ _, metadata ] ) => metadata.mandatory )
      .map( ( [ key, _ ] ) => key );

    const finalSelectedFields = [
      ...new Set( [ ...mandatoryFields, ...selectedFields ] )
    ];

    const selectivePointers = finalSelectedFields.map( ( field ) =>
    {
      switch ( field )
      {
        case "issuanceDate":
          return `/${field}`
        case "validFrom":
          return `/${field}`
        default:
          return `/credentialSubject/${field}`
      }
    } )

    openSignModal( selectedKey, "key-retrieval", {
      purpose: "DID Creation",
      onSuccess: async ( keyPair ) =>
      {
        try
        {
          if ( keyPair instanceof Uint8Array ) return;

          // Create revealed document
          const discloseCryptosuite = createDiscloseCryptosuite( {
            selectivePointers: selectivePointers
          } );
          const discloseSuite = new DataIntegrityProof( {
            cryptosuite: discloseCryptosuite,
            date: new Date()
          } );

          const revealed = await vc.derive( {
            verifiableCredential: vcData.signedCredential,
            suite: discloseSuite,
            documentLoader: documentLoader
          } );

          // Verify revealed document
          const verifyCryptosuite = createVerifyCryptosuite();
          const verifySuite = new DataIntegrityProof( {
            cryptosuite: verifyCryptosuite
          } );
          const signedCredentialCopy = klona( revealed );
          await vc.verifyCredential( {
            credential: signedCredentialCopy,
            suite: verifySuite,
            documentLoader: documentLoader,
            purpose: new AssertionProofPurpose()
          } );

          // Prepare VP
          const controller = didIdentifier;
          keyPair.controller = controller;
          keyPair.id = `${controller}#${selectedKey}`;
          const vpId = ID.unique();

          const vpSuite = new DataIntegrityProof( {
            signer: keyPair.signer(),
            cryptosuite: eddsaRdfc2022CryptoSuite
          } );

          const presentation = vc.createPresentation( {
            verifiableCredential: revealed,
            holder: controller,
            id: `${import.meta.env.VITE_BASE_URL}/dashboard/orgs/${orgId}/vps/${vpId}`,
          } );

          const vp = await vc.signPresentation( {
            presentation,
            suite: vpSuite,
            documentLoader,
            purpose: new AssertionProofPurpose()
          } );

          // Verify VP
          const verifyResult = await vc.verify( {
            presentation: vp,
            suite: [
              new DataIntegrityProof( { cryptosuite: createVerifyCryptosuite() } ),
              new DataIntegrityProof( { cryptosuite: eddsaRdfc2022CryptoSuite } )
            ],
            documentLoader,
            presentationPurpose: new AssertionProofPurpose()
          } );

          if ( verifyResult.verified )
          {
            await AppwriteService.issuePresentation(
              {
                vpId,
                vcId,
                vpData: JSON.stringify( {
                  presentation: vp,
                  contextMetadatas: [ vcData.contextMetadata ]
                } )
              },
              orgId!,
              selectedKey
            );

            queryClient.invalidateQueries( {
              queryKey: [ 'orgVPs', orgId ]
            } );

            toast( {
              title: "VP Issued",
              description: `VP was issued successfully for ${vcId}`
            } );

            setIsVPDialogOpen( false );
          } else
          {
            throw new Error( "VP signature verification failed" );
          }
        } catch ( err )
        {
          toast( {
            title: "Error",
            description: err.message,
            variant: "destructive"
          } );
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {( isLoadingStores || isLoadingVC ) ? (
        <div className="flex justify-center items-center p-4">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : ( vcData ? (
        <div>
          {/* Holder Information */}
          <Card className='mb-5'>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCircle2 className="mr-2 text-blue-600" />
                Credential Holder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <strong>Holder ID:</strong>
                  <p className="text-muted-foreground break-all">
                    {vcData.signedCredential.credentialSubject.id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing VC Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheck className="mr-2 text-green-600" />
                Verifiable Credential Details
                {vcData.signedCredential.type.map( ( type, i ) => (
                  <Badge key={i} variant="secondary" className="ml-2">
                    {type}
                  </Badge>
                ) )}
              </CardTitle>
              <CardDescription>
                Issued by <span className='text-muted-foreground'>{vcData.signedCredential.issuer.name}</span> on {' '}
                <span className='text-muted-foreground'>{format( new Date( vcData.signedCredential.issuanceDate ), 'PPP' )}</span>
                {vcData.signedCredential.validUntil &&
                  <p>Valid until<span className='text-muted-foreground'>{format( new Date( vcData.signedCredential.validUntil ), 'PPP' )}</span> on {' '}</p>
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Credential Subject Details */}
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries( vcData.contextMetadata ).map( ( [ key, metadata ] ) =>
                {
                  const value = vcData.signedCredential.credentialSubject[ key ];

                  return value !== undefined ? (
                    <div
                      key={key}
                      className="bg-background p-4 rounded-lg border flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold text-primary">
                          {metadata.name}
                          {metadata.mandatory && (
                            <Badge variant="outline" className="ml-2 text-green-600">
                              Mandatory
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 text-foreground mt-1">
                          {metadata.description}
                        </p>
                        <p className="text-muted-foreground text-sm break-all">
                          {renderFieldValue( key, value )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard( value.toString() )}
                      >
                        <Copy className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  ) : null;
                } )}
              </div>

              {/* Proof Details */}
              <div className="mt-6 bg-background p-4 rounded-lg border">
                <h3 className="font-semibold mb-2 flex items-center">
                  <CheckCircle2 className="mr-2 text-green-600" />
                  Proof Details
                </h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Type:</span> {' '}
                    <span className='text-muted-foreground'>{vcData.signedCredential.proof.type}</span>
                  </p>
                  <p>
                    <span className="font-medium">Cryptosuite:</span> {' '}
                    <span className='text-muted-foreground'>{vcData.signedCredential.proof.cryptosuite}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {
            <>
              {/* Create Verifiable Presentation Button */}
              <div className="flex justify-end mt-5">
                <Button
                  variant="outline"
                  onClick={() =>
                  {
                    copyToClipboard( vcStores[ 0 ].location )
                  }}
                  className='mr-3'
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Credential Link
                </Button>
                {vcData.signedCredential.credentialSubject.id.split( "/" ).at( -1 ) === orgId && <Button
                  onClick={() => setIsVPDialogOpen( true )}
                  variant="outline"
                >
                  <FileSignature className="mr-2" />
                  Create Verifiable Presentation
                </Button>}
              </div>
              {/* Verifiable Presentation Creation Dialog */}
              <Dialog open={isVPDialogOpen} onOpenChange={setIsVPDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Verifiable Presentation</DialogTitle>
                    <DialogDescription>
                      Select fields to include in the Verifiable Presentation
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {Object.entries( vcData.contextMetadata ).map( ( [ key, metadata ] ) => (
                      <div
                        key={key}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-secondary"
                      >
                        <Checkbox
                          id={`field-${key}`}
                          checked={
                            metadata.mandatory ||
                            selectedFields.includes( key )
                          }
                          onCheckedChange={() =>
                          {
                            if ( !metadata.mandatory )
                            {
                              handleFieldSelection( key );
                            }
                          }}
                          disabled={metadata.mandatory}
                        />
                        <label
                          htmlFor={`field-${key}`}
                          className="flex-grow cursor-pointer"
                        >
                          {metadata.name}
                          {metadata.mandatory && (
                            <Badge variant="outline" className="ml-2 text-green-600">
                              Mandatory
                            </Badge>
                          )}
                          <p className="text-xs text-gray-500">
                            {metadata.description}
                          </p>
                        </label>
                      </div>
                    ) )}

                    <Select
                      onValueChange={setSelectedKey}
                      value={selectedKey}
                      disabled={isLoadingKeys}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a key to link" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingKeys ? (
                          <div className="p-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                            Loading keys...
                          </div>
                        ) : availableKeys && availableKeys.length === 0 ? (
                          <div className="p-2 text-center text-muted-foreground">
                            No unlinked keys available
                          </div>
                        ) : availableKeys && availableKeys.map( ( key ) => (
                          <SelectItem disabled={key.owner.$id !== userId} key={key.$id} value={key.$id}>
                            {key.name} - {key.$id.slice( 0, 10 )}...{key.keyType.map( ( keyType ) => (
                              <Badge key={keyType} className={keyTypesColors[ keyType ] + " mx-1"}>
                                {keyType}
                              </Badge>
                            ) )}
                          </SelectItem>
                        ) )}
                      </SelectContent>
                    </Select>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsVPDialogOpen( false )}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        onClick={handleCreateVP}
                        disabled={isCreating}>
                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Presentation"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>}




        </div> ) : <ErrorComponent message='VC Not Found' /> )}
    </div>
  );
};
export default OrganizationVCViewPage;