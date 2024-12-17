import React, { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PageHeader } from "../../app/PageHeader";
import { useKeyContext } from "@/contexts/keyManagerCtx";
import { Loader2, Eye } from "lucide-react";
import AppwriteService, { VCDocument } from "@/HiD/appwrite/service";
import CreateVCModal from "./IssueVC";

const OrganizationVCsPage: React.FC = () => {
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const { userId, useOrgsList } = useKeyContext();
  const { data: orgs = [], isLoading: isLoadingOrgs } = useOrgsList();

  const [selectedOrgId, setSelectedOrgId] = useState(orgId || "");
  const [activeTab, setActiveTab] = useState<"issued" | "received">("issued");
  const [isIssueVCModalOpen, setIsIssueVCModalOpen] = useState(false);

  // Fetch VCs issued by the organization
  const {
    data: issuedVCs = [],
    isLoading: isLoadingIssuedVCs,
    refetch: refetchIssuedVCs
  } = useQuery<VCDocument[]>({
    queryKey: ['orgIssuedVCs', selectedOrgId],
    queryFn: () => AppwriteService.getCredentialsForOrg(selectedOrgId, userId),
    enabled: !!selectedOrgId && activeTab === "issued"
  });

  // Fetch VCs received by the organization
  const {
    data: receivedVCs = [],
    isLoading: isLoadingReceivedVCs,
    refetch: refetchReceivedVCs
  } = useQuery<VCDocument[]>({
    queryKey: ['orgReceivedVCs', selectedOrgId],
    queryFn: () => AppwriteService.getOrgCredentials(selectedOrgId),
    enabled: !!selectedOrgId && activeTab==="received"
  });

  // Effects to handle organization selection and navigation
  useEffect(() => {
    if (orgId && orgId !== "undefined") setSelectedOrgId(orgId);
    else navigate('/dashboard/orgs/vcs');
  }, [orgId]);

  useEffect(() => {
    if (!selectedOrgId && orgs.length > 0) {
      const firstOrgId = orgs[0].$id;
      setSelectedOrgId(firstOrgId);
      navigate(`/dashboard/orgs/${firstOrgId}/vcs`);
    }
  }, [orgs, selectedOrgId, navigate]);

  // Organization change handler
  const handleOrgChange = (value: string) => {
    setSelectedOrgId(value);
    navigate(`/dashboard/orgs/${value}/vcs`);
  };

  // Find selected organization
  const selectedOrg = orgs.find((org) => org.$id === selectedOrgId);

  // Render common VC table
  const renderVCTable = (vcs: VCDocument[], issuedMode: boolean) => (
    isLoadingIssuedVCs || isLoadingReceivedVCs ? (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ) : vcs.length > 0 ? (
      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Identifier</TableCell>
            <TableCell>{issuedMode ? "Holder" : "Issuer"}</TableCell>
            <TableCell>Created At</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vcs.map((vc) => (
            <TableRow key={vc.$id}>
              <TableCell>{vc.$id}</TableCell>
              <TableCell>
                {vc.identifier.split(":")[1] === "hedera" ? "hedera: "+vc.identifier.split("_")[0].substring(19, 40) + "...#" + vc.identifier.split("_")[1]:"web: "+vc.identifier.substring(0,29)+"..."}
              </TableCell>
              <TableCell>
                {issuedMode
                  ? (vc.holder ? `${vc.holder.name}#${vc.holder.email}` : "External Holder")
                  : `${vc.issuer.name}`
                }
              </TableCell>
              <TableCell>
                {new Date(vc.$createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <NavLink to={`/dashboard/orgs/${selectedOrgId}/vcs/${vc.$id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" /> View VC
                  </Button>
                </NavLink>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ) : (
      <p className="text-muted-foreground mt-4">
        No verifiable credentials {issuedMode ? "issued" : "received"}.
      </p>
    )
  );

  return (
    <div className="relative h-full flex flex-col p-4 min-h-[90vh]">
      <PageHeader
        title="Manage Verifiable Credentials"
        description="View and manage organization credentials"
      />

      {/* Organization Selector */}
      <div className="mb-6">
        <Select
          onValueChange={handleOrgChange}
          value={selectedOrgId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an organization" />
          </SelectTrigger>
          <SelectContent>
            {orgs.length > 0 ? (
              orgs.map((org) => (
                <SelectItem key={org.$id} value={org.$id}>
                  {org.name}
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-center text-muted-foreground">
                No organizations found
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedOrg && (
        <>
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="issued">
                VCs Issued by {selectedOrg.name}
              </TabsTrigger>
              <TabsTrigger value="received">
                VCs Received by {selectedOrg.name}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="issued">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Verifiable Credentials Issued
                </h3>
                <Button onClick={() => setIsIssueVCModalOpen(true)}>
                  Issue Credential
                </Button>
              </div>
              {renderVCTable(issuedVCs, true)}
            </TabsContent>
            
            <TabsContent value="received">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Verifiable Credentials Received
                </h3>
              </div>
              {renderVCTable(receivedVCs, false)}
            </TabsContent>
          </Tabs>

          {/* Issue VC Modal */}
          <CreateVCModal
            isOpen={isIssueVCModalOpen}
            onOpenChange={setIsIssueVCModalOpen}
            org={selectedOrg}
          />
        </>
      )}
    </div>
  );
};

export default OrganizationVCsPage;