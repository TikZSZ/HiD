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
    AlertCircle
  } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useParams } from 'react-router-dom';
import
{
  createSignCryptosuite,
  createDiscloseCryptosuite,
  createVerifyCryptosuite
} from "@digitalbazaar/bbs-2023-cryptosuite"
import { klona } from 'klona';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import jsigs from 'jsonld-signatures';
import * as vc from '@digitalbazaar/vc';
import { documentLoader } from "@/HiD/jsonld-contexts";
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
      credentialSubject: Record<string, any>;
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
import AppwriteService, { VCStoreDocument } from "@/HiD/appwrite/service"
import { useQuery } from '@tanstack/react-query';
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
  const {
    data: vcData,
    // isLoading: isLoadingStores,
    error
  } = useQuery<VCViewProps[ "vcData" ]>( {
    queryKey: [ 'vcData', vcId ],
    queryFn: async () => vcStores.length > 0 && ( await fetch( vcStores[ 0 ].location ) ).json(),
    enabled: ( vcStores.length > 0 ),
  } );
  const [ isVPDialogOpen, setIsVPDialogOpen ] = useState( false );
  const [ selectedFields, setSelectedFields ] = useState<string[]>( [] );
  if ( error )
  {
    return <div>{error.message}</div>
  }
  if ( !vcData )
  {
    return <div>VC not found</div>
  }
  // Extract mandatory fields from context metadata
  const mandatoryFields = Object.entries( vcData.contextMetadata )
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
    // Ensure all mandatory fields are selected
    const finalSelectedFields = [
      ...new Set( [ ...mandatoryFields, ...selectedFields ] )
    ];
    console.log( finalSelectedFields )
    let revealed
    {
      const cryptosuite = createDiscloseCryptosuite( {
        selectivePointers: finalSelectedFields.map((field)=>`/credentialSubject/${field}`)
      } );
      const suite = new DataIntegrityProof( { cryptosuite, date: new Date() } );
      revealed = await vc.derive( { verifiableCredential: vcData.signedCredential, suite: suite, documentLoader: documentLoader } )
      console.dir( revealed )
    }
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
      // onCreateVerifiablePresentation(finalSelectedFields);
      setIsVPDialogOpen( false );
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

    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Credential Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldCheck className="mr-2 text-green-600" />
              Verifiable Credential Details
              {vcData.signedCredential.type.map((type,i)=>{
                return <Badge key={i} variant="secondary" className="ml-2">
                {type}
              </Badge>
              })}
              
            </CardTitle>
            <CardDescription>
              Issued by {vcData.signedCredential.issuer.name} on {' '}
              {format( new Date( vcData.signedCredential.issuanceDate ), 'PPP' )}
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
        </Card>

        {/* Create Verifiable Presentation Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => setIsVPDialogOpen( true )}
            variant="secondary"
          >
            <FileSignature className="mr-2" />
            Create Verifiable Presentation
          </Button>
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

              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsVPDialogOpen( false )}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateVP}>
                  Create Presentation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  export default ViewVCPage;