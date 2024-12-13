import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PageHeader } from "./PageHeader";
import { FormModal } from "../app/FormModal";
import { useKeyContext } from "@/contexts/keyManagerCtx";
import AppwriteService,{ KeyDocument, MembersWithRoles, } from "@/HiD/appwrite/service";
import { Badge } from "../ui/badge";
import { roleColors } from "../OrganizationTable";

const ManageOrganizationPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>(); // Fetch orgId from route params
  const navigate = useNavigate();

  const { orgs } = useKeyContext(); // Replace with appropriate context or API calls

  const [selectedOrgId, setSelectedOrgId] = useState(orgId || ""); // Initial org based on params
  const [members, setMembers] = useState<MembersWithRoles[]>([]);
  const [keys, setKeys] = useState<KeyDocument[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);

  const selectedOrg = orgs.find((org) => org.$id === selectedOrgId);

  useEffect(() => {
    if (orgId) setSelectedOrgId(orgId); // Sync orgId from URL with state
  }, [orgId]);

  // Fetch members
  const handleFetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const data = await AppwriteService.getOrgMembers(selectedOrgId);
      console.log(data)
      setMembers(data);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Fetch keys
  const handleFetchKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const data = await AppwriteService.getKeysForOrganization(selectedOrgId);
      setKeys(data);
    } catch (error) {
      console.error("Error fetching keys:", error);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  // Handle organization selection
  const handleOrgChange = (value: string) => {
    setSelectedOrgId(value);
    navigate(`/dashboard/orgs/${value}`); // Update route dynamically
    setMembers([]);
    setKeys([]);
  };

  return (
    <div className="relative h-full flex flex-col p-4 min-h-[90vh]">
      {/* Header */}
      <PageHeader
        title="Manage Organizations"
        description="View and manage organization members and keys."
        onClick={()=>{}}
      />

      {/* Organization Selector */}
      <div className="mb-6">
        <Select onValueChange={handleOrgChange} value={selectedOrgId}>
          <SelectTrigger>
            <SelectValue placeholder="Select an organization to manage" />
          </SelectTrigger>
          <SelectContent>
            {orgs.map((org) => (
              <SelectItem key={org.$id} value={org.$id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedOrg && (
        <div>
          {/* Organization Details */}
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
              <Button variant="outline" onClick={handleFetchMembers} disabled={isLoadingMembers}>
                {isLoadingMembers ? "Fetching Members..." : "Fetch Members"}
              </Button>
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
                  {members.map((member) => (
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
                        <Button variant="outline" size="sm">
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                  {keys.map((key) => (
                    <TableRow key={key.$id}>
                      <TableCell>{key.name}</TableCell>
                      <TableCell>{key.keyType}</TableCell>
                      <TableCell>{key.keyPurposes.join(", ")}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground mt-4">No keys found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrganizationPage;
