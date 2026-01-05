// components/VisitStockEditor.tsx
"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { AddProductToVisitDialog } from "./AddProductToVisitDialog";
import { checkInAndUpdateStockPositions } from "@/actions/visit.actions";

// Assuming this interface matches your data shape
interface StockPosition {
  id?: string; // optional - add if you have it from DB
  productId: string;
  productName: string;
  mrp: number;
  quantity: number;
  expiryDate: string | null; // ISO string or null
  batchNumber: string | null;
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
    setEditValues({ ...position });
  };

  const handleEditChange = (field: keyof StockPosition, value: any) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async (productId: string) => {
    const updated = { ...editValues, productId };

    // Optimistic update
    setStock((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, ...updated } : p))
    );

    // Prepare formData for server
    const formData = new FormData();
    formData.append("storeId", storeId);
    formData.append("productId", productId);
    formData.append("quantity", (updated.quantity ?? 0).toString());

    if (updated.expiryDate) {
      formData.append("expiryDate", updated.expiryDate);
    }
    if (updated.batchNumber) {
      formData.append("batchNumber", updated.batchNumber);
    }

    const result = await checkInAndUpdateStockPositions(formData);

    if (!result.success) {
      // toast.error(result.error || "Failed to update stock");
      setStock(initialStock); // Rollback
    } else {
      toast.success("Stock updated!");
    }

    setEditingId(null);
    setEditValues({});
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Remove this stock entry?")) return;

    // Optimistic remove
    setStock((prev) => prev.filter((p) => p.productId !== productId));

    const formData = new FormData();
    formData.append("storeId", storeId);
    formData.append("productId", productId);
    formData.append("quantity", "0"); // Signal removal

    const result = await checkInAndUpdateStockPositions(formData);

    if (!result.success) {
      // toast.error(result.error || "Failed to remove stock");
      setStock(initialStock); // Rollback
    } else {
      toast.success("Stock entry removed");
    }
  };

  const handleAddSuccess = () => {
    // Simple refresh for now - improve later with refetch
    window.location.reload();
    // Future: refetch stock from server action
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Current Stock at Store</h2>
        <AddProductToVisitDialog
          storeId={storeId}
          onSuccess={handleAddSuccess}
        />
      </div>

      {/* Stock Table */}
      <div className="overflow-x-auto rounded-md border">
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
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No stock positions yet. Add one above.
                </TableCell>
              </TableRow>
            ) : (
              stock.map((pos) => (
                <TableRow key={pos.productId} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{pos.productName}</TableCell>
                  <TableCell>₹{pos.mrp.toFixed(2)}</TableCell>

                  <TableCell>
                    {editingId === pos.productId ? (
                      <Input
                        type="number"
                        min={0}
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
    </div>
  );
}