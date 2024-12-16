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



// Main Manage Verifiable Credentials Page
const UserVCsPage: React.FC = () =>
{
  const navigate = useNavigate();

  const { orgId } = useParams<{ orgId: string }>();
  const { userId, useOrgsList } = useKeyContext();
  // const { data: orgs = [], isLoading: isLoadingOrgs } = useOrgsList();

  const [ selectedOrgId, setSelectedOrgId ] = useState( orgId || "" );

  // Fetch VCs for the selected organization
  const {
    data: vcs = [],
    isLoading: isLoadingVCs,
    refetch: refetchVCs
  } = useQuery<VCDocument[]>( {
    queryKey: [ 'userVCs', selectedOrgId ],
    queryFn: () => AppwriteService.getCredentialsForUser( userId ),
    enabled: !!userId,
  } );
  const [ vcId, setVcId ] = useState( '' )

  // const {
  //   data: vcStores = [],
  //   isLoading: isLoadingStores
  // } = useQuery<VCStoreDocument[]>( {
  //   queryKey: [ 'vcStores', vcId ],
  //   queryFn: () => vcId ? AppwriteService.listVCStores( vcId ) : Promise.resolve( [] ),
  //   enabled: !!vcId,
  // } );

  // // Effects to handle organization selection
  // useEffect( () =>
  // {
  //   if ( orgId ) setSelectedOrgId( orgId );
  // }, [ orgId ] );

  // useEffect( () =>
  // {
  //   // If no org selected, choose first available org
  //   if ( !selectedOrgId && orgs.length > 0 )
  //   {
  //     const firstOrgId = orgs[ 0 ].$id;
  //     setSelectedOrgId( firstOrgId );
  //     navigate( `/dashboard/orgs/${firstOrgId}/vcs` );
  //   }
  // }, [ orgs, selectedOrgId, navigate ] );

  // Organization change handler
  const handleOrgChange = ( value: string ) =>
  {
    setSelectedOrgId( value );
    navigate( `/dashboard/orgs/${value}/vcs` );
  };

  // Find selected organization
  // const selectedOrg = orgs.find( ( org ) => org.$id === selectedOrgId );

  return (
    <div className="relative h-full flex flex-col p-4 min-h-[90vh]">
      <PageHeader
        title="Manage Verifiable Credentials"
        description="View and issue organization credentials"
      />

      {/* <div className="mb-6">
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
      </div> */}


      {/* Verifiable Credentials Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Verifiable Credentials</h3>
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
                    <NavLink to={`/dashboard/wallet/vcs/${vc.$id}`}>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                          {
                            setVcId( vc.$id )
                          }}
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