// components/VisitStockEditor.tsx
"use client";

import { useEffect, useState } from "react";
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
import { Pencil, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AddProductToVisitDialog } from "./AddProductToVisitDialog";
import { checkInAndUpdateStockPositions } from "@/actions/visit.actions";

interface StockPosition {
  id: string;
  productId: string;
  productName: string;
  mrp: number;
  quantity: number;
  expiryDate: string | null;
  batchNumber: string | null;
}

interface VisitStockEditorProps {
  storeId: string;
  initialStock: StockPosition[];
}

export function VisitStockEditor({
  storeId,
  initialStock,
}: VisitStockEditorProps) {
  const [stock, setStock] = useState<StockPosition[]>(initialStock);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<StockPosition>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Keep client state in sync after revalidation */
  useEffect(() => {
    setStock(initialStock);
  }, [initialStock]);

  /* ───────────── Edit helpers ───────────── */

  const handleEditStart = (pos: StockPosition) => {
    setEditingId(pos.id);
    setEditValues({ ...pos });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleEditSave = async (id: string) => {
    setIsSubmitting(true);
    const prevStock = stock;

    // optimistic update
    setStock((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...editValues } : p))
    );

    const fd = new FormData();
    fd.append("storeId", storeId);
    fd.append("stockPositionId", id);
    fd.append("quantity", String(editValues.quantity ?? 0));
    if (editValues.expiryDate) fd.append("expiryDate", editValues.expiryDate);
    if (editValues.batchNumber)
      fd.append("batchNumber", editValues.batchNumber);

    const res = await checkInAndUpdateStockPositions(fd);

    if (res.success) {
      toast.success("Stock updated successfully");
    } else {
      setStock(prevStock); // rollback
      toast.error(res.error ?? "Failed to update stock");
    }

    setEditingId(null);
    setEditValues({});
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this stock entry?")) return;

    setIsSubmitting(true);
    const prevStock = stock;

    // optimistic delete
    setStock((prev) => prev.filter((p) => p.id !== id));

    const fd = new FormData();
    fd.append("storeId", storeId);
    fd.append("stockPositionId", id);
    fd.append("quantity", "0");

    const res = await checkInAndUpdateStockPositions(fd);

    if (res.success) {
      toast.success("Stock entry removed");
    } else {
      setStock(prevStock); // rollback
      toast.error(res.error ?? "Couldn't delete stock");
    }

    setIsSubmitting(false);
  };

  /* ───────────── Add product success ───────────── */

  const handleAddSuccess = () => {
    toast.success("New product added");
    // stock will refresh automatically via revalidatePath
  };

  /* ───────────── UI ───────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Current Stock at Store</h2>
        <AddProductToVisitDialog
          storeId={storeId}
          onSuccess={handleAddSuccess}
        />
      </div>

      {/* Table */}
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
                <TableCell colSpan={6} className="text-center py-8">
                  No stock positions yet
                </TableCell>
              </TableRow>
            ) : (
              stock.map((pos) => (
                <TableRow key={pos.id}>
                  <TableCell className="font-medium">
                    {pos.productName}
                  </TableCell>

                  <TableCell>₹{pos.mrp.toFixed(2)}</TableCell>

                  <TableCell>
                    {editingId === pos.id ? (
                      <Input
                        type="number"
                        min={0}
                        value={editValues.quantity ?? pos.quantity}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            quantity: Number(e.target.value),
                          })
                        }
                        disabled={isSubmitting}
                        className="w-20"
                      />
                    ) : (
                      pos.quantity
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === pos.id ? (
                      <Input
                        type="date"
                        value={editValues.expiryDate ?? pos.expiryDate ?? ""}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            expiryDate: e.target.value,
                          })
                        }
                        disabled={isSubmitting}
                      />
                    ) : pos.expiryDate ? (
                      format(new Date(pos.expiryDate), "PPP")
                    ) : (
                      "N/A"
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === pos.id ? (
                      <Input
                        value={editValues.batchNumber ?? pos.batchNumber ?? ""}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            batchNumber: e.target.value,
                          })
                        }
                        disabled={isSubmitting}
                      />
                    ) : (
                      pos.batchNumber || "-"
                    )}
                  </TableCell>

                  <TableCell className="text-right space-x-2">
                    {editingId === pos.id ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditSave(pos.id)}
                          disabled={isSubmitting}
                        >
                          <Save className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleEditCancel}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditStart(pos)}
                          disabled={isSubmitting}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(pos.id)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
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
