// components/VisitStockEditor.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Save, Plus } from "lucide-react";
import { ProductSelectorDialog } from "@/components/ProductSelectorDialog";
import { checkInAndUpdateStockPositions } from "@/actions/visit.actions";
import { format } from "date-fns";

interface StockPosition {
  productId: string;
  productName: string;
  mrp: number;
  quantity: number;
  expiryDate: string | null;
  batchNumber: string;
}

interface VisitStockEditorProps {
  storeId: string;
  initialStock: StockPosition[];
}

export function VisitStockEditor({ storeId, initialStock }: VisitStockEditorProps) {
  const [stock, setStock] = useState<StockPosition[]>(initialStock);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<StockPosition>>({});

  const handleEditStart = (position: StockPosition) => {
    setEditingId(position.productId);
    setEditValues(position);
  };

  const handleEditChange = (field: keyof StockPosition, value: any) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async (productId: string) => {
    const updated = { ...editValues, productId };

    // Update local state optimistically
    setStock((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, ...updated } : p))
    );

    // Prepare formData for server
    const formData = new FormData();
    formData.append("storeId", storeId);
    formData.append("productId", productId);
    formData.append("quantity", updated.quantity?.toString() || "");
    if (updated.expiryDate) formData.append("expiryDate", updated.expiryDate);
    if (updated.batchNumber) formData.append("batchNumber", updated.batchNumber);

    const result = await checkInAndUpdateStockPositions(formData);

    if (!result.success) {
      alert(result.error || "Failed to update stock");
      // Rollback on error
      setStock(initialStock);
    }

    setEditingId(null);
    setEditValues({});
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Remove this product from store stock?")) return;

    // Optimistic remove
    setStock((prev) => prev.filter((p) => p.productId !== productId));

    const formData = new FormData();
    formData.append("storeId", storeId);
    formData.append("productId", productId);
    formData.append("quantity", "0"); // Set to 0 to "remove"

    const result = await checkInAndUpdateStockPositions(formData);

    if (!result.success) {
      alert(result.error || "Failed to remove product");
      setStock(initialStock); // Rollback
    }
  };

  const handleAddNew = async (result: any) => {
    if (result.success) {
      // Refresh stock list after add (or optimistic add)
      const updatedStock = await fetch(`/api/stock?storeId=${storeId}`).then(res => res.json());
      setStock(updatedStock);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Current Stock at Store</h2>
        <ProductSelectorDialog
          mode="visit"
          storeId={storeId}
        //   onSuccess={handleAddNew} // Refresh after adding new
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>MRP</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stock.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                No stock positions yet. Add one above.
              </TableCell>
            </TableRow>
          ) : (
            stock.map((pos) => (
              <TableRow key={pos.productId}>
                <TableCell className="font-medium">{pos.productName}</TableCell>
                <TableCell>₹{pos.mrp.toFixed(2)}</TableCell>

                <TableCell>
                  {editingId === pos.productId ? (
                    <Input
                      type="number"
                      value={editValues.quantity ?? pos.quantity}
                      onChange={(e) => handleEditChange("quantity", Number(e.target.value))}
                      className="w-20"
                    />
                  ) : (
                    pos.quantity
                  )}
                </TableCell>

                <TableCell>
                  {editingId === pos.productId ? (
                    <Input
                      type="date"
                      value={editValues.expiryDate ?? pos.expiryDate ?? ""}
                      onChange={(e) => handleEditChange("expiryDate", e.target.value)}
                    />
                  ) : (
                    pos.expiryDate ? format(new Date(pos.expiryDate), "PPP") : "N/A"
                  )}
                </TableCell>

                <TableCell>
                  {editingId === pos.productId ? (
                    <Input
                      value={editValues.batchNumber ?? pos.batchNumber ?? ""}
                      onChange={(e) => handleEditChange("batchNumber", e.target.value)}
                    />
                  ) : (
                    pos.batchNumber || "-"
                  )}
                </TableCell>

                <TableCell className="text-right space-x-2">
                  {editingId === pos.productId ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditSave(pos.productId)}
                    >
                      <Save className="h-4 w-4 text-green-600" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditStart(pos)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(pos.productId)}
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