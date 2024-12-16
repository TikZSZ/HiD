import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// Validation Schema
const organizationSchema = z.object( {
  name: z.string().min( 3, { message: "Organization name must be at least 3 characters." } ),
  description: z.string().optional(),
} );

type OrganizationFormValues = z.infer<typeof organizationSchema>;

import { useKeyContext } from "@/contexts/keyManagerCtx";
import { PageHeader } from "../../app/PageHeader";
import { FormModal } from "../../app/FormModal";
import { Loader2 } from "lucide-react";
import OrganizationTable from "../../OrganizationTable";

const OrganizationsPage: React.FC = () =>
{
  const { useUpsertOrg,useOrgsList } = useKeyContext()
  const upsertOrg = useUpsertOrg()
  // Open/Close Modal
  const {data:orgs,isLoading,} = useOrgsList()
  const [ isModalOpen, setIsModalOpen ] = useState( false );
  const toggleModal = () => setIsModalOpen( !isModalOpen );
  const [ isCreating, setIsCreating ] = useState( false );

  // Create Organization
  const handleCreateOrganization = async ( data: OrganizationFormValues ) =>
  {
    setIsCreating( true )
    try
    {
      const org = await upsertOrg.mutateAsync( data );
      toggleModal();
    } catch ( err )
    {
      console.error( err )
    } finally
    {
      setIsCreating( false )
    }
  };

  const form = useForm<OrganizationFormValues>( {
    resolver: zodResolver( organizationSchema ),
    defaultValues: {
      name: "",
      description: "",
    },
  } );

  const onSubmit = ( data: OrganizationFormValues ) =>
  {
    handleCreateOrganization( data ); // Pass validated data to parent function
    // Close modal on success
  };

  // useEffect(()=>{
  //   getOrgs()
  // },[])

  return (
    <div className="relative h-full flex flex-col p-4 min-h-[90vh]">
      {/* Header */}
      <PageHeader title="Organizations" description="Manage Organizations." onClick={toggleModal} />

      {/* Organizations List */}
      <div className="flex-grow overflow-auto">
        {/* <h3 className="text-lg font-semibold">
          Existing Orgs ({orgs.length})
        </h3> */}
        {orgs && orgs.length > 0 ? (
          <div className="">
            <OrganizationTable organizations={orgs} />
          </div>
        ) : (
          <p className="text-center text-muted-foreground mt-4">No organizations created yet.</p>
        )}
      </div>

      <FormModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} title="Create Organization">
        <Form {...form}>
          <form onSubmit={form.handleSubmit( onSubmit )} className="space-y-4">
            {/* Organization Name */}
            <FormField
              name="name"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel htmlFor="name">Organization Name</FormLabel>
                  <FormControl>
                    <Input id="name" placeholder="Enter organization name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              name="description"
              control={form.control}
              render={( { field } ) => (
                <FormItem>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <FormControl>
                    <Input
                      id="description"
                      placeholder="Enter organization description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Submit Button */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button variant="outline" onClick={toggleModal} type="reset" >
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

export default OrganizationsPage;
