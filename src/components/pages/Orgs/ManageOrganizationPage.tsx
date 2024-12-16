import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PageHeader } from "../../app/PageHeader";
import { FormModal } from "../../app/FormModal";
import { useKeyContext } from "@/contexts/keyManagerCtx";
import { Calendar, Info, KeyIcon, Loader2, User } from "lucide-react";
import AppwriteService, {
  KeyDocument,
  MembersWithRoles,
  OrganizationRole,
  OrganizationWithRoles
} from "@/HiD/appwrite/service";
import { keyTypesColors, roleColors } from "../../OrganizationTable";
import { Badge } from "../../ui/badge";
import { toast } from "@/hooks/use-toast";



// Validation schema for adding a member
const addMemberSchema = z.object( {
  email: z.string().email( "Invalid email address." ),
  roles: z.array( z.nativeEnum( OrganizationRole ) ).nonempty( "At least one role must be selected." ),
} );
type AddMemberFormValues = z.infer<typeof addMemberSchema>;

// New: Add Key Modal Component
const AddKeyModal: React.FC<{
  isOpen: boolean;
  onOpenChange: ( val: boolean ) => void;
  orgId: string;
}> = ( { isOpen, onOpenChange, orgId } ) =>
  {
    const queryClient = useQueryClient();
    const { userId, useKeysList } = useKeyContext();
    const { data: keys, isLoading: isLoadingKeys } = useKeysList()
    // Fetch User's Unlinked Keys Query
    const unlinkedKeys = keys && keys.filter( ( key ) => key.org === null ) || []
    // const {
    //   data: unlinkedKeys = [],
    //   isLoading: isLoadingKeys
    // } = useQuery<KeyDocument[]>({
    //   queryKey: ['userUnlinkedKeys', userId],
    //   queryFn: () => AppwriteService.getUserUnlinkedKeys(userId),
    //   enabled: isOpen
    // });

    // Validation schema for linking a key
    const linkKeySchema = z.object( {
      keyId: z.string().nonempty( "Please select a key to link" ),
    } );
    type LinkKeyFormValues = z.infer<typeof linkKeySchema>;

    // Key Linking Mutation
    const linkKeyMutation = useMutation( {
      mutationFn: ( data: LinkKeyFormValues ) =>
        AppwriteService.linkOrganizationKey( orgId, data.keyId, userId ),
      onSuccess: () =>
      {
        // Invalidate and refetch keys
        queryClient.invalidateQueries( {
          queryKey: [ 'orgKeys', orgId ],
        } );
        queryClient.invalidateQueries( {
          queryKey: [ 'keys', userId ],
        } );

        // Close modal and show success toast
        onOpenChange( false );
        toast( {
          title: "Key Linked",
          description: "The key has been successfully linked to the organization.",
        } );
      },
      onError: ( error ) =>
      {
        console.error( "Error linking key:", error );
        toast( {
          title: "Error",
          description: "Failed to link key. Please try again.",
          variant: "destructive"
        } );
      }
    } );

    const form = useForm<LinkKeyFormValues>( {
      resolver: zodResolver( linkKeySchema ),
      defaultValues: {
        keyId: "",
      },
    } );

    // Selected Key Details
    const selectedKeyId = form.watch( "keyId" );
    const selectedKey = unlinkedKeys.find( key => key.$id === selectedKeyId );

    const handleFormSubmit = ( data: LinkKeyFormValues ) =>
    {
      linkKeyMutation.mutate( data );
    };

    return (
      <FormModal
        isModalOpen={isOpen}
        setIsModalOpen={onOpenChange}
        title="Link Key to Organization"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit( handleFormSubmit )} className="space-y-4">
            <FormField
              name="keyId"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel>Select Key to Link</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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
                        ) : unlinkedKeys.length === 0 ? (
                          <div className="p-2 text-center text-muted-foreground">
                            No unlinked keys available
                          </div>
                        ) : unlinkedKeys.map( ( key ) => (
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

            {/* Key Details Section */}
            {selectedKey && (
              <div className="bg-secondary p-4 rounded-md space-y-2">
                <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-500" />
                <h4 className="font-semibold">Key Details</h4>
              </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span>
                  </div>
                  <span>{selectedKey.name || 'Unnamed Key'}</span>

                  <div className="flex items-center space-x-2">
                    <KeyIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">PublicKey:</span>
                  </div>
                  <span>{selectedKey.publicKey.slice(0,20)}...</span>

                  <div className="flex items-center space-x-2">
                    <KeyIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Type:</span>
                  </div>
                  <span>{selectedKey.keyAlgorithm}</span>

                  <div className="flex items-center space-x-2">
                    <KeyIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Purposes:</span>
                  </div>
                  <div>
                  {selectedKey.keyType.map( ( keyType ) => (
                            <Badge key={keyType} className={keyTypesColors[ keyType ]}>
                              {keyType}
                            </Badge>
                          ) )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Created:</span>
                  </div>
                  <span>{new Date(selectedKey.$createdAt).toLocaleString()}</span>
                </div>

                <div className="bg-secondary/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground break-words">
                    <strong>Public Key:</strong>
                    {selectedKey.publicKey.slice( 0, 20 )}...{selectedKey.publicKey.slice( -20 )}
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange( false )}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={linkKeyMutation.isPending || !selectedKeyId}
              >
                {linkKeyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Link Key"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </FormModal>
    );
  };

const AddMemberModal: React.FC<{
  isOpen: boolean;
  onOpenChange: ( val: boolean ) => void;
  orgId: string;
}> = ( { isOpen, onOpenChange, orgId } ) =>
  {
    const queryClient = useQueryClient();
    const { userId } = useKeyContext();

    // Use mutation for adding a member
    const addMemberMutation = useMutation( {
      mutationFn: ( data: AddMemberFormValues ) =>
        AppwriteService.upsertOrganizationMember( orgId, userId, data.email, data.roles ),
      onSuccess: () =>
      {
        // Invalidate and refetch organization members
        queryClient.invalidateQueries( {
          queryKey: [ 'orgMembers', orgId ]
        } );

        // Close modal and show success toast
        onOpenChange( false );
        toast( {
          title: "Member Added",
          description: "The member has been successfully added to the organization.",
        } );
      },
      onError: ( error ) =>
      {
        console.error( "Error adding member:", error );
        toast( {
          title: "Error",
          description: error.message,
          variant: "destructive"
        } );
      }
    } );

    const form = useForm<AddMemberFormValues>( {
      resolver: zodResolver( addMemberSchema ),
      defaultValues: {
        email: "",
        roles: [],
      },
    } );

    const handleFormSubmit = ( data: AddMemberFormValues ) =>
    {
      addMemberMutation.mutate( data );
    };

    return (
      <FormModal
        isModalOpen={isOpen}
        setIsModalOpen={onOpenChange}
        title="Add Member"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit( handleFormSubmit )} className="space-y-4">
            {/* Email Field - same as before */}
            <FormField
              name="email"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter member's email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Roles Multi-Select - same as before */}
            <FormField
              name="roles"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel>Roles</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {field.value.map( ( role, index ) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-secondary p-2 rounded-md"
                        >
                          <span>{role}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() =>
                              field.onChange( field.value.filter( ( _, i ) => i !== index ) )
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ) )}
                      <Select
                        onValueChange={( value ) =>
                          !field.value.includes( value as OrganizationRole ) &&
                          field.onChange( [ ...field.value, value as OrganizationRole ] )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Add a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values( OrganizationRole ).map( ( role ) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ) )}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange( false )}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add Member"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </FormModal>
    );
  };

const ManageOrganizationPage: React.FC = () =>
{
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { userId, useOrgsList } = useKeyContext();
  const { data: orgs = [], isLoading: isLoadingOrgs } = useOrgsList();

  const [ selectedOrgId, setSelectedOrgId ] = useState( orgId || "" );
  const [ isAddMemberModalOpen, setIsAddMemberModalOpen ] = useState( false );
  const [ isAddKeyModalOpen, setIsAddKeyModalOpen ] = useState( false );

  // Fetch Members Query
  const {
    data: members = [],
    isLoading: isLoadingMembers,
    refetch: refetchMembers
  } = useQuery<MembersWithRoles[]>( {
    queryKey: [ 'orgMembers', selectedOrgId ],
    queryFn: () => AppwriteService.getOrgMembers( selectedOrgId ),
    enabled: !!selectedOrgId,
  } );

  // Fetch Keys Query
  const {
    data: keys = [],
    isLoading: isLoadingKeys,
    refetch: refetchKeys
  } = useQuery<KeyDocument[]>( {
    queryKey: [ 'orgKeys', selectedOrgId ],
    queryFn: () => AppwriteService.getKeysForOrganization( selectedOrgId ),
    enabled: !!selectedOrgId,
  } );

  // Remove Member Mutation
  const removeMemberMutation = useMutation( {
    mutationFn: ( memberId: string ) =>
      AppwriteService.removeOrganizationMember( selectedOrgId, userId, memberId ),
    onSuccess: () =>
    {
      // Invalidate and refetch members
      queryClient.invalidateQueries( {
        queryKey: [ 'orgMembers', selectedOrgId ]
      } );

      toast( {
        title: "Member Removed",
        description: "The member has been successfully removed from the organization.",
      } );
    },
    onError: ( error ) =>
    {
      console.error( "Error removing member:", error );
      toast( {
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive"
      } );
    }
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
      navigate( `/dashboard/orgs/${firstOrgId}/manage` );
    }
  }, [ orgs, selectedOrgId, navigate ] );

  // Organization change handler
  const handleOrgChange = ( value: string ) =>
  {
    setSelectedOrgId( value );
    navigate( `/dashboard/orgs/${value}/manage` );
  };

  // Handler for removing a member
  const handleRemoveMember = ( memberId: string ) =>
  {
    removeMemberMutation.mutate( memberId );
  };

  // Find selected organization
  const selectedOrg = orgs.find( ( org ) => org.$id === selectedOrgId );

  return (
    <div className="relative h-full flex flex-col p-4 min-h-[90vh]">
      <PageHeader
        title="Manage Organizations"
        description="View and manage organization members and keys."
        buttonText="Manage VCs"
        onClick={()=>{navigate(`/dashboard/orgs/${orgId}/vcs`)}}
      />

      <div className="mb-6">
        <Select
          onValueChange={handleOrgChange}
          value={selectedOrgId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an organization to manage" />
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Name:</strong> {selectedOrg.name}</p>
              <p><strong>Description:</strong> {selectedOrg.description || "No description provided."}</p>
            </CardContent>
          </Card>

          {/* Members Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Members</h3>
              <div className="flex space-x-2">
                {/* <Button
                  variant="outline"
                  onClick={() => refetchMembers()}
                  disabled={isLoadingMembers}
                >
                  {isLoadingMembers ? "Fetching Members..." : "Fetch Members"}
                </Button> */}
                <Button onClick={() => setIsAddMemberModalOpen( true )}>
                  Add Member
                </Button>
              </div>
            </div>

            {members.length > 0 ? (
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map( ( member, i ) => (
                    <TableRow key={member.$id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {member.roles.map( ( role ) => (
                            <Badge key={role} className={roleColors[ role ]}>
                              {role}
                            </Badge>
                          ) )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {
                          i === 0 ? null : <Button
                            variant="outline"
                            onClick={() => handleRemoveMember( member.$id )}
                            disabled={removeMemberMutation.isPending}
                          >
                            {removeMemberMutation.isPending ? "Removing..." : "Remove Member"}
                          </Button>
                        }
                      </TableCell>
                    </TableRow>
                  ) )}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground mt-4">No members found.</p>
            )}
          </div>

          {/* Keys Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Keys</h3>
              <div className="flex space-x-2">
                {/* <Button
                  variant="outline"
                  onClick={() => refetchKeys()}
                  disabled={isLoadingKeys}
                >
                  {isLoadingKeys ? "Fetching Keys..." : "Fetch Keys"}
                </Button> */}
                <Button onClick={() => setIsAddKeyModalOpen( true )}>
                  Link Key
                </Button>
              </div>
            </div>

            {keys.length > 0 ? (
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Key Type</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map( ( key ) => (
                    <TableRow key={key.$id}>
                      <TableCell>{key.owner.name}</TableCell>
                      <TableCell>{key.name}</TableCell>
                      <TableCell><div className="gap-x-2">
                      {key.keyType.map( ( keyType ) => (
                            <Badge key={keyType} className={keyTypesColors[ keyType ]+" mx-1"}>
                              {keyType}
                            </Badge>
                          ) )}</div></TableCell>
                      {/* <TableCell>{key.keyPurposes.join( ", " )}</TableCell> */}
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) )}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground mt-4">No keys found.</p>
            )}
          </div>

          {/* Add Member Modal */}
          <AddMemberModal
            isOpen={isAddMemberModalOpen}
            onOpenChange={setIsAddMemberModalOpen}
            orgId={selectedOrgId}
          />

          {/* Add Key Modal */}
          <AddKeyModal
            isOpen={isAddKeyModalOpen}
            onOpenChange={setIsAddKeyModalOpen}
            orgId={selectedOrgId}
          />
        </>
      )}
    </div>
  );
};

export default ManageOrganizationPage;