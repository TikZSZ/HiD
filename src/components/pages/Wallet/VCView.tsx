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
  Loader2
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
const { purposes: { AssertionProofPurpose } } = jsigs;
interface VCViewProps
{
  vcData: {
    signedCredential: {
      id: string;
      type: string[];
      issuer: {
        id: string;
        name: string;
      };
      issuanceDate: string;
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
  };
  onCreateVerifiablePresentation: ( selectedFields: string[] ) => void;
}
import AppwriteService, { KeyAlgorithm, KeyDocument, VCStoreDocument } from "@/HiD/appwrite/service"
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSignModal } from '../../app/SignModal';
import { useKeyContext } from '@/contexts/keyManagerCtx';
import ErrorComponent from '../../ErrorComponent';
import { ID } from 'appwrite';
import { keyTypesColors } from '../../OrganizationTable';
export const ViewVCPage: React.FC = (
  //   { 
  //   vcData, 
  //   onCreateVerifiablePresentation 
  // }
) =>
{
  const { vcId } = useParams()
  const {
    data: vcStores = [],
    isLoading: isLoadingStores
  } = useQuery<VCStoreDocument[]>( {
    queryKey: [ 'vcStores', vcId ],
    queryFn: () => vcId ? AppwriteService.listVCStores( vcId ) : Promise.resolve( [] ),
    enabled: !!vcId,
  } );
  const [ isCreating, setIsCreating ] = useState( false )
  const { userId } = useKeyContext()
  const { openSignModal } = useSignModal()
  const [ selectedKey, setSelectedKey ] = useState<string>()
  const {
    data: vcData,
    isLoading: isLoadingVC,
    error
  } = useQuery<VCViewProps[ "vcData" ]>( {
    queryKey: [ 'vcData', vcId ],
    queryFn: async () => vcStores.length > 0 && ( await fetch( vcStores[ 0 ].location ) ).json(),
    enabled: ( vcStores.length > 0 ),
  } );
  const didIdentifier = vcData && vcData.signedCredential.credentialSubject.id
  const queryClient = useQueryClient()
  const {
    data: did,
    isLoading: isLoadingKeys
  } = useQuery( {
    queryKey: [ 'didIdentifier', didIdentifier ],
    queryFn: async () => ( await AppwriteService.getDIDFromIdentifier( didIdentifier! ) )[ 0 ],
    enabled: !!didIdentifier,
  } );


  const [ isVPDialogOpen, setIsVPDialogOpen ] = useState( false );
  const [ selectedFields, setSelectedFields ] = useState<string[]>( [] );
  if ( error )
  {
    return <div>{error.message}</div>
  }
  // Extract mandatory fields from context metadata
  const mandatoryFields = vcData && Object.entries( vcData.contextMetadata )
    .filter( ( [ _, metadata ] ) => metadata.mandatory )
    .map( ( [ key, _ ] ) => key );

  const handleFieldSelection = ( fieldKey: string ) =>
  {
    setSelectedFields( prev =>
      prev.includes( fieldKey )
        ? prev.filter( f => f !== fieldKey )
        : [ ...prev, fieldKey ]
    );
  };

  const handleCreateVP = async () =>
  {
    setIsCreating( true )
    if ( !( selectedKey && vcId && mandatoryFields ) )
    {
      toast( { title: "Selected Key Not valid" } )
      setIsCreating( false )
      return
    }
    // Ensure all mandatory fields are selected
    const finalSelectedFields = [
      ...new Set( [ ...mandatoryFields, ...selectedFields ] )
    ];

    console.log( finalSelectedFields, selectedKey )
    openSignModal( selectedKey, "key-retrieval", {
      purpose: "DID Creation",
      onSuccess: async ( keyPair ) =>
      {
        try
        {
          if ( keyPair instanceof Uint8Array ) return
          // create revealed document
          let revealed
          {
            const cryptosuite = createDiscloseCryptosuite( {
              selectivePointers: finalSelectedFields.map( ( field ) => `/credentialSubject/${field}` )
            } );
            const suite = new DataIntegrityProof( { cryptosuite, date: new Date() } );
            revealed = await vc.derive( { verifiableCredential: vcData.signedCredential, suite: suite, documentLoader: documentLoader } )
            console.dir( revealed )
          }
          // verify that the revealed document is valid
          {
            const cryptosuite = createVerifyCryptosuite();
            const suite = new DataIntegrityProof( { cryptosuite } );
            const signedCredentialCopy = klona( revealed );
            const result = await vc.verifyCredential( {
              credential: signedCredentialCopy,
              suite, documentLoader: documentLoader,
              purpose: new AssertionProofPurpose()
            } );
            console.log( result )
          }
          // create VP
          const controller = didIdentifier
          keyPair.controller = controller
          keyPair.id = `${controller}#did-root-key`
          const vpId = ID.unique()
          const suite = new DataIntegrityProof( {
            signer: keyPair.signer(), cryptosuite: eddsaRdfc2022CryptoSuite
          } );
          const presentation = vc.createPresentation( {
            verifiableCredential: revealed, holder: controller, id: import.meta.env[ "VITE_BASE_URL" ] + `/dashboard/wallets/vps/${vpId}`,
          } );
          console.log( presentation )
          // console.log((await canonize(rdf,{ algorithm: 'RDFC-1.0', })))
          const vp = await vc.signPresentation( {
            presentation, suite, documentLoader, purpose: new AssertionProofPurpose()
          } );
          console.log( vp )
          let result
          {
            const cryptosuite = createVerifyCryptosuite();
            const suite = new DataIntegrityProof( { cryptosuite: cryptosuite } );
            const suite2 = new DataIntegrityProof( { cryptosuite: eddsaRdfc2022CryptoSuite } );
            result = await vc.verify( { presentation: vp, suite: [ suite, suite2 ], documentLoader, presentationPurpose: new AssertionProofPurpose() } );
            console.log( result.verified, result.error )
          }
          if ( result.verified )
          {
            const vpDoc = await AppwriteService.issuePresentation( {
              vpId, vcId, vpData: JSON.stringify( {
                presentation: vp, contextMetadatas: [ vcData.contextMetadata ]
              } )
            }, userId, selectedKey )
            queryClient.invalidateQueries({queryKey:[ 'userVPs', userId ]})
            toast( { title: "VP Issued", description: "VP was issued successfully for" + " " + vcId, variant: "default" } );
            console.log( vpDoc )
          } else
          {
            throw new Error( "VP signature failed verfication" )
          }
        } catch ( err )
        {
          toast( { title: "Opps an error occured!", description: err.message } )
          console.log( err )
        } finally
        {
          setIsCreating( false )
        }
      },
      onError: ( error ) =>
      {
        console.error( "Signing failed", error );
        setIsCreating( false )
      },
      onClose: () =>
      {
        console.error( "Signing failed", "User Rejected" );
        setIsCreating( false );
      },
    } );

    // onCreateVerifiablePresentation(finalSelectedFields);
    // setIsVPDialogOpen( false );
  };

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
    const metadata = vcData.contextMetadata[ key ];

    // Handle different data types
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
  const filteredKeys = did && did.keys && did.keys.filter((key)=>key.keyAlgorithm === KeyAlgorithm.ED25519) || []

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Credential Overview Card */}
      {( isLoadingStores || isLoadingVC ) ? (
        <div className="flex justify-center items-center p-4">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : ( vcData ? <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldCheck className="mr-2 text-green-600" />
            Verifiable Credential Details
            {vcData.signedCredential.type.map( ( type, i ) =>
            {
              return <Badge key={i} variant="secondary" className="ml-2">
                {type}
              </Badge>
            } )}

          </CardTitle>
          <CardDescription>
            Issued by <span className='text-muted-foreground'>{vcData.signedCredential.issuer.name}</span> on {' '}
            <span className='text-muted-foreground'>{format( new Date( vcData.signedCredential.issuanceDate ), 'PPP' )}</span>
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
                <span className="font-medium ">Type:</span> {' '}
                <span className='text-muted-foreground' >{vcData.signedCredential.proof.type}</span>
              </p>
              <p>
                <span className="font-medium ">Cryptosuite:</span> {' '}
                <span className='text-muted-foreground' >{vcData.signedCredential.proof.cryptosuite}</span>

              </p>
            </div>
          </div>
        </CardContent>
      </Card> : <ErrorComponent message='VC Not Found' /> )}

      {/* Create Verifiable Presentation Button */}
      {
        vcData && <div className="flex justify-end">
          <Button
            onClick={() => setIsVPDialogOpen( true )}
            variant="secondary"
          >
            <FileSignature className="mr-2" />
            Create Verifiable Presentation
          </Button>
        </div>
      }

      {/* Verifiable Presentation Creation Dialog */}
      {vcData &&
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
                  ) : did && did.keys && did.keys.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">
                      No unlinked keys available
                    </div>
                  ) : did && did.keys && did.keys.map( ( key ) => (
                    <SelectItem key={key.$id} value={key.$id}>
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
      }
    </div>
  );
};

export default ViewVCPage;