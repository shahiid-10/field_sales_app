// components/admin/UserManagementTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  assignSalesmanRole,
  assignStockManagerRole,
  assignAdminRole,
} from "@/actions/user.actions";

interface PlainUser {
  id: string;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  email: string | null | undefined;
  role: string | null | undefined;
}

interface Props {
  initialUsers: PlainUser[];
}

export default function UserManagementTable({ initialUsers }: Props) {
  const getRoleBadge = (role: string | null | undefined) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="destructive">Admin</Badge>;
      case "STOCK_MANAGER":
        return <Badge variant="secondary">Stock Manager</Badge>;
      case "SALESMAN":
        return <Badge variant="default">Salesman</Badge>;
      default:
        return <Badge variant="outline">No Role</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[220px]">Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Current Role</TableHead>
            <TableHead className="text-right w-[180px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialUsers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-24 text-center text-muted-foreground"
              >
                No users found
              </TableCell>
            </TableRow>
          ) : (
            initialUsers.map((user) => (
              <TableRow
                key={user.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell className="font-medium">
                  {user.firstName || "—"} {user.lastName || ""}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email || "—"}
                </TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell className="text-right">
                  {/* <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        Assign Role
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                      <div className="grid gap-1">
                        <Button
                          variant="ghost"
                          className="justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={async () => {
                            const formData = new FormData();
                            formData.append('userId', user.id);
                            await assignSalesmanRole(formData);
                          }}
                        >
                          Salesman
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={async () => {
                            const formData = new FormData();
                            formData.append('userId', user.id);
                            await assignStockManagerRole(formData);
                          }}
                        >
                          Stock Manager
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={async () => {
                            const formData = new FormData();
                            formData.append('userId', user.id);
                            await assignAdminRole(formData);
                          }}
                        >
                          Admin
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover> */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Assign Role
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                        onClick={async () => {
                          const formData = new FormData();
                          formData.append("userId", user.id);
                          await assignSalesmanRole(formData);
                        }}
                      >
                        Salesman
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-green-600 focus:text-green-700 focus:bg-green-50"
                        onClick={async () => {
                          const formData = new FormData();
                          formData.append("userId", user.id);
                          await assignStockManagerRole(formData);
                        }}
                      >
                        Stock Manager
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                        onClick={async () => {
                          const formData = new FormData();
                          formData.append("userId", user.id);
                          await assignAdminRole(formData);
                        }}
                      >
                        Admin
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
