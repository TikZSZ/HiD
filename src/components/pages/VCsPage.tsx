import React, { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PageHeader } from "./PageHeader";
import { FormModal } from "../app/FormModal";
import { useKeyContext } from "@/contexts/keyManagerCtx";
import { Loader2, Eye, Link as LinkIcon } from "lucide-react";
import AppwriteService, {
  VCDocument,
  VCStoreDocument,
  CreateVCDTO,
  VCStoreType,
  StoredByEnum
} from "@/HiD/appwrite/service";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { resolveDID } from "@/did";
import { DidDocument } from "@/HiD/did-sdk";
import { keyTypesColors } from "../OrganizationTable";

// Validation schema for issuing a Verifiable Credential
const issueVCSchema = z.object( {
  identifier: z.string().refine( ( identifier ) =>
  {
    if ( identifier.split( ":" ).length !== 4 ) return false
    if ( identifier.split( ":" )[ 3 ].split( "_" ).length !== 2 ) return false
    if ( identifier.split( ":" )[ 3 ].split( "_" )[ 1 ].split( "." ).length !== 3 ) return false
    return true
  }, "identifier should be of form did:hedera:network:....._TopicID " ),
  vcData: z.string().refine( ( val ) =>
  {
    try
    {
      JSON.parse( val );
      return true;
    } catch
    {
      return false;
    }
  }, { message: "VC Data must be a valid JSON" } ),
  keyId: z.string().nonempty( "Select a key to sign the credential" ),
  // holderId: z.string().optional(),
  // storeType: z.nativeEnum( VCStoreType ).default( VCStoreType.CLOUD )
} );
type IssueVCFormValues = z.infer<typeof issueVCSchema>;



// Issue VC Modal Component
const IssueVCModal: React.FC<{
  isOpen: boolean;
  onOpenChange: ( val: boolean ) => void;
  orgId: string;
}> = ( { isOpen, onOpenChange, orgId } ) =>
  {
    const queryClient = useQueryClient();
    const { userId } = useKeyContext();
    const [ didDocument, setDidDocument ] = useState<DidDocument>()
    // Fetch organization members and keys
    const {
      data: orgMembers = [],
      isLoading: isLoadingMembers
    } = useQuery( {
      queryKey: [ 'orgMembers', orgId ],
      queryFn: () => AppwriteService.getOrgMembers( orgId ),
      enabled: isOpen
    } );

    const {
      data: keys = [],
      isLoading: isLoadingKeys
    } = useQuery( {
      queryKey: [ 'memberKeys', orgId ],
      queryFn: () => AppwriteService.getKeysForOrgAndUser( userId, orgId ),
      enabled: isOpen
    } );




    // Issue VC Mutation
    const issueVCMutation = useMutation( {
      mutationFn: ( data: IssueVCFormValues ) =>
      {
        const { keyId, ...rest } = data
        return AppwriteService.issueCredential( rest, orgId, userId, keyId );
      },
      onSuccess: async ( newVC ) =>
      {

        // Invalidate and refetch VCs
        queryClient.invalidateQueries( {
          queryKey: [ 'orgVCs', orgId ]
        } );

        // Close modal and show success toast
        onOpenChange( false );
        toast( {
          title: "Credential Issued",
          description: "The Verifiable Credential has been successfully issued.",
        } );
      },
      onError: ( error ) =>
      {
        console.error( "Error issuing credential:", error );
        toast( {
          title: "Error",
          description: "Failed to issue credential. Please try again. " + error.message,
          variant: "destructive"
        } );
      }
    } );

    const form = useForm<IssueVCFormValues>( {
      resolver: zodResolver( issueVCSchema ),
      defaultValues: {
        identifier: "",
        vcData: JSON.stringify( {}, null, 2 ),
        keyId: "",
        // holderId: "",
        // storeType: VCStoreType.CLOUD
      },
    } );

    const handleFormSubmit = async ( data: IssueVCFormValues ) =>
    {
      const didDocument = await resolveDID( data.identifier )
      if ( didDocument && !didDocument.hasOwner() )
      {
        form.setError( "identifier", { message: "Invalid DIDIdentifier" } )
        return
      }
      setDidDocument( didDocument )
      issueVCMutation.mutate( data );
    };


    return (
      <FormModal
        isModalOpen={isOpen}
        setIsModalOpen={onOpenChange}
        title="Issue Verifiable Credential"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit( handleFormSubmit )} className="space-y-4">
            {/* Identifier Field */}
            <FormField
              name="identifier"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel>Credential Identifier</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter unique identifier" {...field} />
                    {/* {didDocument?.toJSON()} */}
                  </FormControl>
                  <FormDescription>
                    A unique identifier for this verifiable credential
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Key Selection */}
            <FormField
              name="keyId"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel>Signing Key</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingKeys}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a key to sign the credential" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {keys.map( ( key ) => (
                        <SelectItem key={key.$id} value={key.$id}>
                          {key.name} {key.keyType.map( ( keyType ) => (
                            <Badge key={keyType} className={keyTypesColors[ keyType ] + " mx-1"}>
                              {keyType}
                            </Badge>
                          ) )}
                        </SelectItem>
                      ) )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The key that will be used to cryptographically sign this credential
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Holder Selection (Optional) */}
            {/* <FormField
              name="holderId"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel>Credential Holder (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingMembers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select credential holder" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {orgMembers.map( ( member ) => (
                        <SelectItem key={member.$id} value={member.$id}>
                          {member.name} ({member.email})
                        </SelectItem>
                      ) )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The member who will be the subject of this credential
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            {/* VC Data Field */}
            <FormField
              name="vcData"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel>Credential Data</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter credential data as JSON"
                      {...field}
                      rows={6}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the verifiable credential data in JSON format
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Store Type Selection */}
            {/* <FormField
              name="storeType"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel>Storage Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select storage type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values( VCStoreType ).map( ( type ) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ) )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose where to store this verifiable credential
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            {/* Submit Button */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange( false )}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={issueVCMutation.isPending}
              >
                {issueVCMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Issue Credential"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </FormModal>
    );
  };

// Main Manage Verifiable Credentials Page
const ManageVCPage: React.FC = () =>
{
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  const { userId, useOrgsList } = useKeyContext();
  const { data: orgs = [], isLoading: isLoadingOrgs } = useOrgsList();

  const [ selectedOrgId, setSelectedOrgId ] = useState( orgId || "" );
  const [ isIssueVCModalOpen, setIsIssueVCModalOpen ] = useState( false );
  const [ selectedVCStoresId, setSelectedVCStoresId ] = useState<string | null>( null );

  // Fetch VCs for the selected organization
  const {
    data: vcs = [],
    isLoading: isLoadingVCs,
    refetch: refetchVCs
  } = useQuery<VCDocument[]>( {
    queryKey: [ 'orgVCs', selectedOrgId ],
    queryFn: () => AppwriteService.getCredentialsForOrg( selectedOrgId, userId ),
    enabled: !!selectedOrgId,
  } );

  // Effects to handle organization selection
  useEffect( () =>
  {
    if ( orgId ) setSelectedOrgId( orgId );
  }, [ orgId ] );

  useEffect( () =>
  {
    // If no org selected, choose first available org
    if ( !selectedOrgId && orgs.length > 0 )
    {
      const firstOrgId = orgs[ 0 ].$id;
      setSelectedOrgId( firstOrgId );
      navigate( `/dashboard/orgs/${firstOrgId}/vcs` );
    }
  }, [ orgs, selectedOrgId, navigate ] );

  // Organization change handler
  const handleOrgChange = ( value: string ) =>
  {
    setSelectedOrgId( value );
    navigate( `/dashboard/orgs/${value}/vcs` );
  };

  // Find selected organization
  const selectedOrg = orgs.find( ( org ) => org.$id === selectedOrgId );

  return (
    <div className="relative h-full flex flex-col p-4 min-h-[90vh]">
      <PageHeader
        title="Manage Verifiable Credentials"
        description="View and issue organization credentials"
        onClick={() => { }}
      />

      <div className="mb-6">
        <Select
          onValueChange={handleOrgChange}
          value={selectedOrgId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an organization" />
          </SelectTrigger>
          <SelectContent>
            {orgs.map( ( org ) => (
              <SelectItem key={org.$id} value={org.$id}>
                {org.name}
              </SelectItem>
            ) )}
          </SelectContent>
        </Select>
      </div>

      {selectedOrg && (
        <>
          {/* Verifiable Credentials Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Verifiable Credentials</h3>
              <Button onClick={() => setIsIssueVCModalOpen( true )}>
                Issue Credential
              </Button>
            </div>

            {isLoadingVCs ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : vcs.length > 0 ? (
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableCell>Identifier</TableCell>
                    <TableCell>Holder</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vcs.map( ( vc ) => (
                    <TableRow key={vc.$id}>
                      <TableCell>{vc.identifier}</TableCell>
                      <TableCell>
                        {vc.holder && `${vc.holder.name}#${vc.holder.email}` || <span className="text-muted-foreground">No Holder</span>}
                      </TableCell>
                      <TableCell>
                        {new Date( vc.$createdAt ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVCStoresId( vc.$id )}
                          >
                            <Eye className="h-4 w-4 mr-2" /> View Stores
                          </Button>
                        </div>
                        <NavLink to={`/dashboard/orgs/${orgId}/vcs/${vc.$id}`}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="h-4 w-4 mr-2" /> View VC
                            </Button>
                          </div>
                        </NavLink>
                      </TableCell>
                    </TableRow>
                  ) )}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground mt-4">No verifiable credentials found.</p>
            )}
          </div>

          {/* Issue VC Modal */}
          <IssueVCModal
            isOpen={isIssueVCModalOpen}
            onOpenChange={setIsIssueVCModalOpen}
            orgId={selectedOrgId}
          />

          {/* VC Stores Modal */}
          {/* {selectedVCStoresId && (
            <VCStoresModal
              isOpen={!!selectedVCStoresId}
              onOpenChange={() => setSelectedVCStoresId(null)}
              vcId={selectedVCStoresId}
            />
          )} */}
        </>
      )}
    </div>
  );
};

export default ManageVCPage;