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
  Download,
  Verified
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

interface VCredential
{
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
}
interface VPViewProps
{
  vpData: {
    presentation: {
      '@context': string[];
      type: string[];
      verifiableCredential: VCredential[];
      id: string;
      holder: string;
      proof: {
        type: string;
        cryptosuite: string;
      }
    }
    contextMetadatas: Record<string, {
      name: string;
      mandatory: boolean;
      type: string;
      description: string;
    }>[];
  };
  onCreateVerifiablePresentation: ( selectedFields: string[] ) => void;
}
import AppwriteService, {  PresentationDocument } from "@/HiD/appwrite/service"
import { useQuery } from '@tanstack/react-query';
import ErrorComponent from '../../ErrorComponent';
export const ViewVCPage: React.FC = (
) =>
{
  const { vpId } = useParams()
  const {
    data: vp,
    isLoading: isLoadingPresentation
  } = useQuery<PresentationDocument>( {
    queryKey: [ 'vp', vpId ],
    queryFn: async () => ( await AppwriteService.getPresentation( vpId! ) ),
    enabled: !!vpId,
  } );
  const vpURL = vp && vp.location
  const {
    data: vpData,
    isLoading: isLoadingVP,
    error
  } = useQuery<VPViewProps[ "vpData" ]>( {
    queryKey: [ 'vpData', vpId ],
    queryFn: async () => ( await fetch( vpURL! ) ).json(),
    enabled: !!vpURL,
  } );

  const [ isVerifying, setIsVerifying ] = useState( false );
  const [ verificationResult, setVerificationResult ] = useState<boolean | null>( null );
  if ( error )
  {
    return <div>{error.message}</div>
  }

  const copyToClipboard = ( text: string ) =>
  {
    navigator.clipboard.writeText( text );
    toast( {
      title: "Copied to Clipboard",
      description: "The value has been copied successfully.",
    } );
  };

  const renderFieldValue = ( i: number, key: string, value: any ) =>
  {
    const metadata = vpData!.contextMetadatas[ i ][ key ];

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

  const handleVerifyPresentation = async () =>
  {
    setIsVerifying( true );
    try
    {
      // const result = await onVerifyPresentation( vpData.presentation.id );
      const cryptosuite = createVerifyCryptosuite();
      const suite = new DataIntegrityProof( { cryptosuite: cryptosuite } );
      const suite2 = new DataIntegrityProof( { cryptosuite: eddsaRdfc2022CryptoSuite } );
      const result = await vc.verify( { presentation: vpData?.presentation, suite: [ suite, suite2 ], documentLoader, presentationPurpose: new AssertionProofPurpose() } );
      setVerificationResult( result.verified );
      toast( {
        title: result ? "Verification Successful" : "Verification Failed",
        description: result
          ? "The Verifiable Presentation is valid."
          : "The Verifiable Presentation could not be verified.",
        variant: result ? "default" : "destructive"
      } );
    } catch ( error )
    {
      toast( {
        title: "Verification Error",
        description: "An error occurred during verification.",
        variant: "destructive"
      } );
    } finally
    {
      setIsVerifying( false );
    }

  };
  const downloadPresentation = () =>
  {
    const jsonData = JSON.stringify( vpData.presentation, null, 2 );
    const blob = new Blob( [ jsonData ], { type: 'application/json' } );
    const url = URL.createObjectURL( blob );
    const link = document.createElement( 'a' );
    link.href = url;
    link.download = `${vpData.presentation.id}.json`;
    link.click();
    URL.revokeObjectURL( url );
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Credential Overview Card */}
      {( isLoadingVP || isLoadingPresentation ) ? (
        <div className="flex justify-center items-center p-4">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : ( vpData ?
        // <Card>
        //   <CardHeader>
        //     <CardTitle className="flex items-center">
        //       <ShieldCheck className="mr-2 text-green-600" />
        //       Verifiable Credential Details
        //       {vpData.signedCredential.type.map( ( type, i ) =>
        //       {
        //         return <Badge key={i} variant="secondary" className="ml-2">
        //           {type}
        //         </Badge>
        //       } )}

        //     </CardTitle>
        //     <CardDescription>
        //       Issued by {vcData.signedCredential.issuer.name} on {' '}
        //       {format( new Date( vcData.signedCredential.issuanceDate ), 'PPP' )}
        //     </CardDescription>
        //   </CardHeader>
        //   <CardContent>
        //     {/* Credential Subject Details */}
        //     <div className="grid md:grid-cols-2 gap-4">
        //       {Object.entries( vcData.contextMetadata ).map( ( [ key, metadata ] ) =>
        //       {
        //         const value = vcData.signedCredential.credentialSubject[ key ];

        //         return value !== undefined ? (
        //           <div
        //             key={key}
        //             className="bg-background p-4 rounded-lg border flex justify-between items-center"
        //           >
        //             <div>
        //               <div className="font-semibold text-primary">
        //                 {metadata.name}
        //                 {metadata.mandatory && (
        //                   <Badge variant="outline" className="ml-2 text-green-600">
        //                     Mandatory
        //                   </Badge>
        //                 )}
        //               </div>
        //               <p className="text-xs text-gray-500 text-foreground mt-1">
        //                 {metadata.description}
        //               </p>
        //               <p className="text-muted-foreground text-sm break-all">
        //                 {renderFieldValue( key, value )}
        //               </p>

        //             </div>
        //             <Button
        //               variant="ghost"
        //               size="icon"
        //               onClick={() => copyToClipboard( value.toString() )}
        //             >
        //               <Copy className="h-4 w-4 text-gray-500" />
        //             </Button>
        //           </div>
        //         ) : null;
        //       } )}
        //     </div>

        //     {/* Proof Details */}
        //     <div className="mt-6 bg-background p-4 rounded-lg border">
        //       <h3 className="font-semibold mb-2 flex items-center">
        //         <CheckCircle2 className="mr-2 text-green-600" />
        //         Proof Details
        //       </h3>
        //       <div className="space-y-2">
        //         <p>
        //           <span className="font-medium ">Type:</span> {' '}
        //           <span className='text-muted-foreground' >{vcData.signedCredential.proof.type}</span>
        //         </p>
        //         <p>
        //           <span className="font-medium ">Cryptosuite:</span> {' '}
        //           <span className='text-muted-foreground' >{vcData.signedCredential.proof.cryptosuite}</span>

        //         </p>
        //       </div>
        //     </div>
        //   </CardContent>
        // </Card> 
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldCheck className="mr-2 text-green-600" />
              Verifiable Presentation Details
              <Badge variant="secondary" className="ml-2">
                {vpData.presentation.type[ 1 ] || 'Presentation'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Holder: {vpData.presentation.holder}
              <br />
              Created on {format( vp?.$createdAt!, 'PPP' )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Presentation Proof Details */}
            <div className="bg-background p-4 rounded-lg border mb-6 border-l-4 border-green-500">
              <h3 className="font-semibold mb-2 flex items-center">
                <CheckCircle2 className="mr-2 text-green-600" />
                Presentation Proof Details
              </h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Type:</span> {' '}
                  {vpData.presentation.proof.type}
                </p>
                <p>
                  <span className="font-medium">Cryptosuite:</span> {' '}
                  {vpData.presentation.proof.cryptosuite}
                </p>
              </div>
            </div>

            {/* Credentials in Presentation */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileSignature className="mr-2 text-blue-600" />
                Included Credentials
                <Badge variant="outline" className="ml-2">
                  {vpData.presentation.verifiableCredential.length}
                </Badge>
              </h3>

              <div className="space-y-4">
                {vpData.presentation.verifiableCredential.map( ( credential, index ) => (
                  <Card key={credential.id} className="border-l-4 border-blue-500">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span>{credential.type[ 1 ] || 'Credential'}</span>
                          <Badge variant="secondary" className="ml-2">
                            {credential.issuer.name}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard( credential.id )}
                        >
                          <Copy className="h-4 w-4 text-gray-500" />
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        {credential.issuanceDate && `Issued on ${format( new Date( credential.issuanceDate ), 'PPP' )}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-3">
                        {Object.entries( vpData.contextMetadatas[ index ] ).map( ( [ key, metadata ] ) =>
                        {
                          const value = credential.credentialSubject[ key ];

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
                                  {renderFieldValue( index, key, value )}
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
                      <div className="mt-6 bg-background p-4 rounded-lg border border-l-4 border-green-800">
                        <h3 className="font-semibold mb-2 flex items-center">
                          <CheckCircle2 className="mr-2 text-green-600" />
                          Proof Details
                        </h3>
                        <div className="space-y-2">
                          <p>
                            <span className="font-medium ">Type:</span> {' '}
                            <span className='text-muted-foreground' >{credential.proof.type}</span>
                          </p>
                          <p>
                            <span className="font-medium ">Cryptosuite:</span> {' '}
                            <span className='text-muted-foreground' >{credential.proof.cryptosuite}</span>

                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                ) )}
              </div>
            </div>
          </CardContent>
        </Card>

        : <ErrorComponent message='VP Not Found' /> )}

      {/* Action Buttons */}
      {
        vpURL && <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={downloadPresentation}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Presentation
          </Button>
          <Button
            onClick={handleVerifyPresentation}
            disabled={isVerifying}
            variant={verificationResult === false ? "destructive" : "default"}
          >
            {isVerifying ? (
              "Verifying..."
            ) : (
              <>
                <Verified className="mr-2 h-4 w-4" />
                Verify Presentation
              </>
            )}
          </Button>
        </div>
      }

      {/* Verification Result */}
      {verificationResult !== null && (
        <div className={`
          p-4 rounded-lg flex items-center 
          ${verificationResult
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
          }
        `}>
          {verificationResult ? <CheckCircle2 className="mr-2" /> : <AlertCircle className="mr-2" />}
          {verificationResult
            ? "Presentation is verified and valid."
            : "Presentation verification failed."}
        </div>
      )}
    </div>
  );
};

export default ViewVCPage;