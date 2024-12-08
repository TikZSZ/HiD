import React, { useState } from "react";
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
import { PageHeader } from "./PageHeader";
import { FormModal } from "../app/FormModal";

const OrganizationsPage: React.FC = () =>
{
  const { upsertOrg, orgs } = useKeyContext()
  
  // Open/Close Modal
  const [ isModalOpen, setIsModalOpen ] = useState( false );
  const toggleModal = () => setIsModalOpen( !isModalOpen );

  // Create Organization
  const handleCreateOrganization = async (data:OrganizationFormValues) =>
  {
    if ( !data.name ) return; // Basic validation
    const org = await upsertOrg( data );
    toggleModal();
  };

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: OrganizationFormValues) => {
    handleCreateOrganization(data); // Pass validated data to parent function
     // Close modal on success
  };

  return (
    <div className="relative h-full flex flex-col p-4 min-h-[90vh]">
      {/* Header */}
      <PageHeader title="Organizations" description="Manage Organizations." onClick={toggleModal} />

      {/* Organizations List */}
      <div className="flex-grow overflow-auto">
        {orgs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgs.map( ( org ) => (
              <Card key={org.$id} className="w-full">
                <CardHeader>
                  <CardTitle>{org.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{org.description || "No description provided"}</p>
                </CardContent>
              </Card>
            ) )}
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

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button variant="outline" onClick={toggleModal} type="reset">
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </Form>
      </FormModal>
    </div>
  );
};

export default OrganizationsPage;
