import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PageHeader } from "./PageHeader";
import { FormModal } from "../app/FormModal";
import { useKeyContext } from "@/contexts/keyManagerCtx.2";
import { Loader2 } from "lucide-react";
import AppwriteService, { KeyDocument, MembersWithRoles, OrganizationRole } from "@/HiD/appwrite/service";
import { roleColors } from "../OrganizationTable";
import { Badge } from "../ui/badge";
// Validation schema for adding a member
// Validation Schema
const addMemberSchema = z.object( {
  email: z.string().email( "Invalid email address." ),
  roles: z.array( z.nativeEnum( OrganizationRole ) ).nonempty( "At least one role must be selected." ),
} );
const AddMemberModal: React.FC<{ isOpen: boolean; onOpenChange: ( val: boolean ) => void; onSubmit: ( data: AddMemberFormValues ) => Promise<void>; }> = ( {
  isOpen,
  onOpenChange,
  onSubmit,
} ) =>
{
  const [ isSubmitting, setIsSubmitting ] = useState( false );

  const form = useForm<AddMemberFormValues>( {
    resolver: zodResolver( addMemberSchema ),
    defaultValues: {
      email: "",
      roles: [],
    },
  } );

  const handleFormSubmit = async ( data: AddMemberFormValues ) =>
  {
    setIsSubmitting( true );
    try
    {
      await onSubmit( data );
      form.reset(); // Reset form after successful submission
      onOpenChange( false );
    } catch ( error )
    {
      console.error( "Error adding member:", error );
    } finally
    {
      setIsSubmitting( false );
    }
  };



  return (
    <FormModal isModalOpen={isOpen} setIsModalOpen={onOpenChange} title="Add Member" >
      <Form {...form}>
        <form onSubmit={form.handleSubmit( handleFormSubmit )} className="space-y-4">
          {/* Email Field */}
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
          {/* Roles Multi-Select */}
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
            <Button variant="outline" onClick={() => { onOpenChange( true ) }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Member"}
            </Button>
          </div>
        </form>
      </Form>
    </FormModal>
  );
};

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

const ManageOrganizationPage: React.FC = () =>
{
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  const { orgs, userId, getOrgs } = useKeyContext();
  const [ selectedOrgId, setSelectedOrgId ] = useState( orgId || "" );
  const [ members, setMembers ] = useState<MembersWithRoles[]>( [] );
  const [ keys, setKeys ] = useState<KeyDocument[]>( [] );
  const [ isLoadingMembers, setIsLoadingMembers ] = useState( false );
  const [ isLoadingKeys, setIsLoadingKeys ] = useState( false );

  const [ isAddMemberModalOpen, setIsAddMemberModalOpen ] = useState( false );
  const [ isAddingMember, setIsAddingMember ] = useState( false );
  const [ isRemovingMember, setIsRemovingMember ] = useState( false );

  const selectedOrg = orgs.find( ( org ) => org.$id === selectedOrgId );

  useEffect( () =>
  {
    if ( orgId ) setSelectedOrgId( orgId );
  }, [ orgId ] );
  useEffect( () =>
  {
    if ( !selectedOrg )
    {
      if ( orgs.length > 0 )
      {
        setSelectedOrgId( orgs[ 0 ].$id )
      }
    };
    handleFetchMembers()
  }, [ selectedOrg ] );
  useEffect( () =>
  {
    getOrgs()
  }, [] )

  const handleFetchMembers = async () =>
  {
    setIsLoadingMembers( true );
    try
    {
      const data = await AppwriteService.getOrgMembers( selectedOrgId );
      setMembers( data );
    } catch ( error )
    {
      console.error( "Error fetching members:", error );
    } finally
    {
      setIsLoadingMembers( false );
    }
  };

  const handleFetchKeys = async () =>
  {
    setIsLoadingKeys( true );
    try
    {
      const data = await AppwriteService.getKeysForOrganization( selectedOrgId );
      setKeys( data );
    } catch ( error )
    {
      console.error( "Error fetching keys:", error );
    } finally
    {
      setIsLoadingKeys( false );
    }
  };

  const handleOrgChange = ( value: string ) =>
  {
    setSelectedOrgId( value );
    navigate( `/dashboard/orgs/${value}` );
    setMembers( [] );
    setKeys( [] );
  };

  const handleAddMember = async ( data: AddMemberFormValues ) =>
  {
    setIsAddingMember( true );
    try
    {
      await AppwriteService.upsertOrganizationMember( selectedOrgId, userId, data.email, data.roles );
      console.log( data )
      setIsAddMemberModalOpen( false );
      handleFetchMembers(); // Refresh members list
    } catch ( error )
    {
      console.error( "Error adding member:", error );
    } finally
    {
      setIsAddingMember( false );
    }
  };

  const handleRemoveMember = async ( memberId: string ) =>
  {
    setIsRemovingMember( true );
    try
    {
      await AppwriteService.removeOrganizationMember( selectedOrgId, userId, memberId );
      handleFetchMembers(); // Refresh members list
    } catch ( error )
    {
      console.error( "Error Removing member:", error );
    } finally
    {
      setIsRemovingMember( false );
    }
  };



  return (
    <div className="relative h-full flex flex-col p-4 min-h-[90vh]">
      <PageHeader title="Manage Organizations" description="View and manage organization members and keys." onClick={() => { }} />

      <div className="mb-6">
        <Select onValueChange={handleOrgChange} value={selectedOrgId}>
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
                <Button variant="outline" onClick={handleFetchMembers} disabled={isLoadingMembers}>
                  {isLoadingMembers ? "Fetching Members..." : "Fetch Members"}
                </Button>
                <Button onClick={() => setIsAddMemberModalOpen( true )}>Add Member</Button>
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
                  {members.map( ( member ) => (
                    <TableRow key={member.$id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell><div className="flex flex-wrap gap-2">
                        {member.roles.map( ( role ) => (
                          <Badge key={role} className={roleColors[ role ]}>
                            {role}
                          </Badge>
                        ) )}
                      </div></TableCell>
                      <TableCell>
                        <Button variant="outline" onClick={() =>
                        {
                          handleRemoveMember( member.$id )
                        }} disabled={isRemovingMember}>
                          {isRemovingMember ? "Remove Member" : "Remove Member"}
                        </Button>
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
              <Button variant="outline" onClick={handleFetchKeys} disabled={isLoadingKeys}>
                {isLoadingKeys ? "Fetching Keys..." : "Fetch Keys"}
              </Button>
            </div>
            {keys.length > 0 ? (
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Key Type</TableCell>
                    <TableCell>Key Purposes</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map( ( key ) => (
                    <TableRow key={key.$id}>
                      <TableCell>{key.name}</TableCell>
                      <TableCell>{key.keyType}</TableCell>
                      <TableCell>{key.keyPurposes.join( ", " )}</TableCell>
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
          <AddMemberModal isOpen={isAddMemberModalOpen} onOpenChange={setIsAddMemberModalOpen} onSubmit={handleAddMember} />
        </>
      )}
    </div>
  );
};

export default ManageOrganizationPage;
