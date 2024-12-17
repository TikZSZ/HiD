import React, { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { PageHeader } from "../../app/PageHeader";
import { useKeyContext } from "@/contexts/keyManagerCtx";
import { Loader2, Eye, Link as LinkIcon } from "lucide-react";
import AppwriteService, {
  VCDocument,
  VCStoreDocument,
} from "@/HiD/appwrite/service";



// Manage User Verifiable Credentials Page
const UserVCsPage: React.FC = () =>
{
  const { userId } = useKeyContext();
  // const { data: orgs = [], isLoading: isLoadingOrgs } = useOrgsList();

  // Fetch VCs for the selected organization
  const {
    data: vcs = [],
    isLoading: isLoadingVCs,
    refetch: refetchVCs
  } = useQuery<VCDocument[]>( {
    queryKey: [ 'userVCs', userId ],
    queryFn: () => AppwriteService.getCredentialsForUser( userId ),
    enabled: !!userId,
  } );

  return (
    <div className="relative h-full flex flex-col p-4 min-h-[90vh]">
      <PageHeader
        title="Manage Verifiable Credentials"
        description="View Verifiable Credentials"
      />

      {/* Verifiable Credentials Section */}
      <div className="mb-6">

        {isLoadingVCs ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : vcs.length > 0 ? (
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Identifier</TableCell>
                <TableCell>Issued By</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vcs.map( ( vc ) => (
                <TableRow key={vc.$id}>
                  <TableCell>{vc.$id}</TableCell>
                  <TableCell>{vc.identifier.split( "_" )[ 0 ].substring( 19, 40 ) + "...#" + vc.identifier.split( "_" )[ 1 ]}</TableCell>
                  <TableCell>
                    {vc.issuer.name}
                  </TableCell>
                  <TableCell>
                    {new Date( vc.$createdAt ).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <NavLink to={`/dashboard/wallet/vcs/${vc.$id}`}>
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

    </div>
  );
};

export default UserVCsPage;