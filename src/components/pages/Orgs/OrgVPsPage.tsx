import React, { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { PageHeader } from "../../app/PageHeader";
import { useKeyContext } from "@/contexts/keyManagerCtx";
import { Loader2, Eye, Link as LinkIcon } from "lucide-react";
import AppwriteService, {
  PresentationDocument,
  VCDocument,
  VCStoreDocument,
} from "@/HiD/appwrite/service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ErrorComponent from "@/components/ErrorComponent";



// Main Manage Verifiable Credentials Page
const OrgVPsPage: React.FC = () =>
{
  const navigate = useNavigate();

  const { orgId } = useParams<{ orgId: string }>();
  const { userId, useOrgsList } = useKeyContext();
  const { data: orgs = [], isLoading: isLoadingOrgs } = useOrgsList();

  const [ selectedOrgId, setSelectedOrgId ] = useState( orgId || "" );
  const [ isIssueVCModalOpen, setIsIssueVCModalOpen ] = useState( false );

  // Fetch VPs for the selected organization
  const {
    data: vps = [],
    isLoading: isLoadingVPs,
    refetch: refetchVCs
  } = useQuery<PresentationDocument[]>( {
    queryKey: [ 'orgVPs', orgId ],
    queryFn: () => AppwriteService.getPresentationsForOrg( orgId! ),
    enabled: !!orgId,
  } );

  // Effects to handle organization selection
  useEffect( () =>
  {
    if ( orgId && orgId !== "undefined" ) setSelectedOrgId( orgId )
    else navigate( `/dashboard/orgs/vps` );
  }, [ orgId ] );

  useEffect( () =>
  {
    // If no org selected, choose first available org
    if ( !selectedOrgId && orgs.length > 0 )
    {
      const firstOrgId = orgs[ 0 ].$id;
      setSelectedOrgId( firstOrgId );
      navigate( `/dashboard/orgs/${firstOrgId}/vps` );
    }
  }, [ orgs, selectedOrgId, navigate ] );

  // Organization change handler
  const handleOrgChange = ( value: string ) =>
  {
    setSelectedOrgId( value );
    navigate( `/dashboard/orgs/${value}/vps` );
  };

  // Find selected organization
  const selectedOrg = orgs.find( ( org ) => org.$id === selectedOrgId );
  // const { data: orgs = [], isLoading: isLoadingOrgs } = useOrgsList();




  return (
    <div className="relative h-full flex flex-col p-4 min-h-[90vh]">
      <PageHeader
        title="Verifiable Presentations"
        description="View Verifiable Presentations"
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
            {orgs.length > 0 ? orgs.map( ( org ) => (
              <SelectItem key={org.$id} value={org.$id}>
                {org.name}
              </SelectItem>
            ) ) : <div className="p-2 text-center text-muted-foreground">
              No organizations found
            </div>}
          </SelectContent>
        </Select>
      </div>


      {/* Verifiable Credentials Section */}
      <div className="mb-6">
        {isLoadingVPs ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : vps.length > 0 ? (
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableCell>VP ID</TableCell>
                <TableCell>VC ID</TableCell>
                <TableCell>Signed By</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vps.map( ( vc ) => (
                <TableRow key={vc.$id}>
                  <TableCell>{vc.$id}</TableCell>
                  <TableCell>{vc.vcId}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{vc.signedBy.name}</span>#{vc.signedBy.publicKey.substring( 0, 20 )}...
                  </TableCell>
                  <TableCell>
                    {new Date( vc.$createdAt ).toLocaleString()}
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
                    <NavLink to={`/dashboard/orgs/${orgId}/vps/${vc.$id}`}>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" /> View VP
                        </Button>
                      </div>
                    </NavLink>
                  </TableCell>
                </TableRow>
              ) )}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground mt-4 text-xl">No verifiable presentations found.</p>
        )}
      </div>
    </div>
  );
};

export default OrgVPsPage;