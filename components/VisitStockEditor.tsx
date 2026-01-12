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
      toast.success("Stock updated");
    } else {
      setStock(prevStock);
      toast.error(res.error ?? "Update failed");
    }

    setEditingId(null);
    setEditValues({});
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this stock entry?")) return;

    setIsSubmitting(true);
    const prevStock = stock;

    setStock((prev) => prev.filter((p) => p.id !== id));

    const fd = new FormData();
    fd.append("storeId", storeId);
    fd.append("stockPositionId", id);
    fd.append("quantity", "0");

    const res = await checkInAndUpdateStockPositions(fd);

    if (res.success) {
      toast.success("Stock removed");
    } else {
      setStock(prevStock);
      toast.error(res.error ?? "Delete failed");
    }

    setIsSubmitting(false);
  };

  /* ───────────── UI ───────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap sm:items-center">
        <h2 className="text-xl font-semibold">Current Stock</h2>
        <AddProductToVisitDialog storeId={storeId} />
      </div>

      {/* ===== Mobile view ===== */}
      <div className="space-y-4 md:hidden">
        {stock.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No stock positions yet
          </div>
        )}

        {stock.map((pos) => {
          const isEditing = editingId === pos.id;

          return (
            <div
              key={pos.id}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{pos.productName}</div>
                  <div className="text-sm text-muted-foreground">
                    ₹{pos.mrp}
                  </div>
                </div>

                <div className="flex gap-1">
                  {isEditing ? (
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
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(pos.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Qty</span>
                  {isEditing ? (
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
                    />
                  ) : (
                    <div>{pos.quantity}</div>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground">Batch</span>
                  {isEditing ? (
                    <Input
                      value={editValues.batchNumber ?? pos.batchNumber ?? ""}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          batchNumber: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <div>{pos.batchNumber || "-"}</div>
                  )}
                </div>

                <div className="col-span-2">
                  <span className="text-muted-foreground">Expiry</span>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editValues.expiryDate ?? pos.expiryDate ?? ""}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          expiryDate: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <div>
                      {pos.expiryDate
                        ? format(new Date(pos.expiryDate), "PPP")
                        : "N/A"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Desktop table ===== */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>MRP</TableHead>
              <TableHead>Qty</TableHead>
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
              stock.map((pos) => {
                const isEditing = editingId === pos.id;

                return (
                  <TableRow key={pos.id}>
                    <TableCell className="font-medium">
                      {pos.productName}
                    </TableCell>
                    <TableCell>₹{pos.mrp}</TableCell>

                    <TableCell>
                      {isEditing ? (
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
                          className="w-20"
                        />
                      ) : (
                        pos.quantity
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={
                            editValues.expiryDate ?? pos.expiryDate ?? ""
                          }
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              expiryDate: e.target.value,
                            })
                          }
                        />
                      ) : pos.expiryDate ? (
                        format(new Date(pos.expiryDate), "PPP")
                      ) : (
                        "N/A"
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={
                            editValues.batchNumber ??
                            pos.batchNumber ??
                            ""
                          }
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              batchNumber: e.target.value,
                            })
                          }
                        />
                      ) : (
                        pos.batchNumber || "-"
                      )}
                    </TableCell>

                    <TableCell className="text-right space-x-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditSave(pos.id)}
                          >
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleEditCancel}
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
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(pos.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
