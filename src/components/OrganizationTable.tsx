import React, { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"; // Import Table components
import { Badge } from "@/components/ui/badge"; // Import Badge for roles
import { Button } from "@/components/ui/button";
import { OrganizationWithRoles, OrganizationRole, KeyType } from "@/HiD/appwrite/service"; // Adjust import paths as needed
import { NavLink } from "react-router-dom";


export const roleColors: Record<OrganizationRole, string> = {
  OWNER: "bg-green-500 text-white",
  ADMIN: "bg-blue-500 text-white",
  MEMBER: "bg-gray-500 text-white",
  VERIFIER: "bg-purple-500 text-white",
};
export const keyTypesColors: Record<KeyType, string> = {
  ENCRYPTION: "bg-green-500 text-white",
  SIGNING: "bg-blue-500 text-white",
  SELECTIVE_DISCLOSURE: "bg-purple-500 text-white",
};

interface OrganizationTableProps
{
  organizations: OrganizationWithRoles[];
}

const OrganizationTable: React.FC<OrganizationTableProps> = ( { organizations } ) =>
{
  const [ sortKey, setSortKey ] = useState<keyof OrganizationWithRoles>( "name" );
  const [ sortOrder, setSortOrder ] = useState<"asc" | "desc">( "asc" );

  // Sort organizations based on selected key and order
  const sortedOrganizations = [ ...organizations ].sort( ( a, b ) =>
  {
    const aValue = a[ sortKey ];
    const bValue = b[ sortKey ];
    if ( typeof aValue === "string" && typeof bValue === "string" )
    {
      return sortOrder === "asc"
        ? aValue.localeCompare( bValue )
        : bValue.localeCompare( aValue );
    }
    return 0;
  } );

  const handleSort = ( key: keyof OrganizationWithRoles ) =>
  {
    if ( sortKey === key )
    {
      setSortOrder( ( prev ) => ( prev === "asc" ? "desc" : "asc" ) );
    } else
    {
      setSortKey( key );
      setSortOrder( "asc" );
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* <h3 className="text-lg font-semibold">Connected Organizations</h3> */}
      {sortedOrganizations.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell onClick={() => handleSort( "name" )} className="cursor-pointer">
                Organization Name {sortKey === "name" && ( sortOrder === "asc" ? "↑" : "↓" )}
              </TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrganizations.map( ( org ) => (
              <TableRow key={org.$id}>
                <TableCell>{org.name}</TableCell>
                <TableCell>{org.description || "No description provided"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {org.roles.map( ( role ) => (
                      <Badge key={role} className={roleColors[ role ]}>
                        {role}
                      </Badge>
                    ) )}
                  </div>
                </TableCell>
                <TableCell>
                  <NavLink to={`/dashboard/orgs/${org.$id}/manage`}>
                    <Button variant="secondary" size="sm">
                      More Info
                    </Button>
                  </NavLink>
                </TableCell>
              </TableRow>
            ) )}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground text-center">No organizations connected.</p>
      )}
    </div>
  );
};

export default OrganizationTable;
