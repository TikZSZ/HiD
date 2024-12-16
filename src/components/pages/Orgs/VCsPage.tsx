import React, { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { PageHeader } from "../../app/PageHeader";
import { useKeyContext } from "@/contexts/keyManagerCtx";
import { Loader2, Eye, Link as LinkIcon } from "lucide-react";
import AppwriteService, {
  VCDocument,
} from "@/HiD/appwrite/service";
import CreateVCModal from "./IssueVC";


// Main Manage Verifiable Credentials Page
const ManageVCPage: React.FC = () =>
{
  const navigate = useNavigate();
  
  const { orgId } = useParams<{ orgId: string }>();
  const { userId, useOrgsList } = useKeyContext();
  const { data: orgs = [], isLoading: isLoadingOrgs } = useOrgsList();

  const [ selectedOrgId, setSelectedOrgId ] = useState( orgId || "" );
  const [ isIssueVCModalOpen, setIsIssueVCModalOpen ] = useState( false );

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
                    <TableCell>ID</TableCell>
                    <TableCell>Identifier</TableCell>
                    <TableCell>Holder</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vcs.map( ( vc ) => (
                    <TableRow key={vc.$id}>
                      <TableCell>{vc.$id}</TableCell>
                      <TableCell>{vc.identifier.split("_")[0].substring(19,40) +"...#"+vc.identifier.split("_")[1]}</TableCell>
                      <TableCell>
                        {vc.holder ? `${vc.holder.name}#${vc.holder.email}` || <span className="text-muted-foreground">No Holder</span> : "External User"}
                      </TableCell>
                      <TableCell>
                        {new Date( vc.$createdAt ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {/* <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVCStoresId( vc.$id )}
                          >
                            <Eye className="h-4 w-4 mr-2" /> View Stores
                          </Button>
                        </div> */}
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
          <CreateVCModal
            isOpen={isIssueVCModalOpen}
            onOpenChange={setIsIssueVCModalOpen}
            org={selectedOrg}
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