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



// Main Manage Verifiable Credentials Page
const VPsPage: React.FC = () =>
{
  const { userId } = useKeyContext();
  // const { data: orgs = [], isLoading: isLoadingOrgs } = useOrgsList();

  // Fetch VCs for the selected organization
  const {
    data: vps = [],
    isLoading: isLoadingVPs,
    refetch: refetchVCs
  } = useQuery<PresentationDocument[]>( {
    queryKey: [ 'userVPs', userId ],
    queryFn: () => AppwriteService.getPresentations( userId ),
    enabled: !!userId,
  } );
  const [ vcId, setVcId ] = useState( '' )

  

  return (
    <div className="relative h-full flex flex-col p-4 min-h-[90vh]">
      <PageHeader
        title="Verifiable Presentations"
        description="View Verifiable Presentations"
      />


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
                <TableCell>ID</TableCell>
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
                    {vc.signedBy.name+"#"+vc.signedBy.publicKey.substring(0,20)}
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
                    <NavLink to={`/dashboard/wallet/vps/${vc.$id}`}>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                          {
                            setVcId( vc.$id )
                          }}
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
          <p className="text-muted-foreground mt-4">No verifiable presentations found.</p>
        )}
      </div>

    </div>
  );
};

export default VPsPage;