// components/ProductManagementTable.tsx
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
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  manufacturer?: string | null;
  mrp: number;
//   createdAt: string;
}

interface ProductManagementTableProps {
  initialProducts: Product[];
}

export default function ProductManagementTable({
  initialProducts,
}: ProductManagementTableProps) {
  const [products, setProducts] = useState(initialProducts);

  // Placeholder for delete (you can connect to a real server action)
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    // TODO: Call your delete server action
    // await deleteProduct(id);

    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Placeholder for edit (can open a dialog)
  const handleEdit = (product: Product) => {
    // TODO: Open edit dialog
    alert(`Edit product: ${product.name}`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Manufacturer</TableHead>
            <TableHead>MRP (₹)</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No products found.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.manufacturer || "-"}</TableCell>
                <TableCell>₹{product.mrp.toFixed(2)}</TableCell>
                {/* <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell> */}
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}