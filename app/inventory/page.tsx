// app/inventory/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package2, AlertTriangle, DollarSign, PlusCircle, CalendarClock } from "lucide-react";

// Dummy inventory data (now includes expiryDate)
const dummyInventory = [
  {
    id: "prod-1",
    name: "Paracetamol 500mg",
    manufacturer: "ABC Pharma",
    mrp: 50,
    quantity: 1200,
    lowStockThreshold: 200,
    expiryDate: new Date("2026-06-30"), // June 30, 2026
  },
  {
    id: "prod-2",
    name: "Vitamin C Tablets",
    manufacturer: "XYZ Labs",
    mrp: 120,
    quantity: 450,
    lowStockThreshold: 100,
    expiryDate: new Date("2025-11-15"), // November 15, 2025
  },
  {
    id: "prod-3",
    name: "Cough Syrup",
    manufacturer: "MediCo",
    mrp: 80,
    quantity: 30,
    lowStockThreshold: 50,
    expiryDate: new Date("2025-09-30"), // September 30, 2025 (near expiry)
  },
  {
    id: "prod-4",
    name: "Antibiotic Ointment",
    manufacturer: "HealthPlus",
    mrp: 150,
    quantity: 800,
    lowStockThreshold: 150,
    expiryDate: new Date("2027-03-10"), // March 10, 2027
  },
];

export default async function InventoryPage() {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  // Everyone can view, only stock-manager + admin can add
  const canAddStock = ["stock-manager", "admin"].includes(
    user.publicMetadata.role as string
  );

  // Stats
  const totalProducts = dummyInventory.length;
  const lowStockItems = dummyInventory.filter(
    (item) => item.quantity <= item.lowStockThreshold
  ).length;
  const totalValue = dummyInventory.reduce(
    (sum, item) => sum + item.mrp * item.quantity,
    0
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Central Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Current warehouse stock levels
          </p>
        </div>

        {canAddStock && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Inbound Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Inbound Stock</DialogTitle>
                <DialogDescription>
                  Enter details for new stock received in warehouse.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="product" className="text-right">
                    Product
                  </Label>
                  <Input id="product" className="col-span-3" placeholder="e.g. Paracetamol 500mg" />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manufacturer" className="text-right">
                    Manufacturer
                  </Label>
                  <Input id="manufacturer" className="col-span-3" placeholder="e.g. ABC Pharma" />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">
                    Quantity
                  </Label>
                  <Input id="quantity" type="number" className="col-span-3" min="1" placeholder="e.g. 500" />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="mrp" className="text-right">
                    MRP (₹)
                  </Label>
                  <Input id="mrp" type="number" className="col-span-3" placeholder="e.g. 50" />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="batch" className="text-right">
                    Batch No
                  </Label>
                  <Input id="batch" className="col-span-3" placeholder="e.g. BATCH-001" />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="expiry" className="text-right">
                    Expiry Date
                  </Label>
                  <Input id="expiry" type="date" className="col-span-3" />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline">Cancel</Button>
                <Button>Add Stock</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table - with new Expiry Date column */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Details</CardTitle>
          <CardDescription>
            Current quantities, expiry dates, and low stock alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead className="text-right">MRP</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Expiry Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dummyInventory.map((item) => {
                  const isLowStock = item.quantity <= item.lowStockThreshold;
                  const isNearExpiry = item.expiryDate && new Date(item.expiryDate) < new Date("2026-01-01");

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.manufacturer}</TableCell>
                      <TableCell className="text-right">₹{item.mrp}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.expiryDate ? format(item.expiryDate, "MMM dd, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        {isLowStock && (
                          <Badge variant="destructive">Low Stock</Badge>
                        )}
                        {isNearExpiry && (
                          <Badge variant="outline" className="border-orange-500 text-orange-700">
                            Near Expiry
                          </Badge>
                        )}
                        {!isLowStock && !isNearExpiry && (
                          <Badge variant="secondary">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}