"use client";

import { useState, useEffect } from "react";
import { getOrderForFulfillment, processFulfillment, updateOrderStatus } from "@/actions/order.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

interface OrderItem {
  productId: string;
  productName: string;
  requestedQty: number;
  availableQty: number;
}

interface Props {
  orderId: string;
  currentStatus: string;
  storeId: string;
}

export default function OrderStatusChangeDialog({ orderId, currentStatus, storeId }: Props) {
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [fulfilledQtys, setFulfilledQtys] = useState<Record<string, string>>({});

  const isFulfillmentMode = newStatus === "PARTIAL" || newStatus === "FULFILLED";

  useEffect(() => {
    if (!open) {
      setOrderItems([]);
      setFulfilledQtys({});
      setError(null);
      return;
    }

    if (isFulfillmentMode) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const data = await getOrderForFulfillment(orderId);
          setOrderItems(data.items);

          const initial = data.items.reduce<Record<string, string>>((acc, item) => {
            acc[item.productId] =
              newStatus === "FULFILLED"
                ? Math.min(item.requestedQty, item.availableQty).toString()
                : "0";
            return acc;
          }, {});

          setFulfilledQtys(initial);
        } catch (err: any) {
          setError(err.message || "Failed to load items");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [open, isFulfillmentMode, newStatus, orderId]);

  const handleQtyChange = (productId: string, value: string) => {
    const item = orderItems.find((i) => i.productId === productId);
    if (!item) return;

    if (value === "" || value === "-") {
      setFulfilledQtys((prev) => ({ ...prev, [productId]: "0" }));
      return;
    }

    const num = Number(value);
    if (Number.isNaN(num)) return;

    const max = Math.min(item.requestedQty, item.availableQty);
    if (num >= 0 && num <= max) {
      setFulfilledQtys((prev) => ({ ...prev, [productId]: value }));
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isFulfillmentMode) {
        const qtys = Object.fromEntries(
          Object.entries(fulfilledQtys).map(([k, v]) => [k, v === "" ? 0 : Number(v)])
        );
        await processFulfillment(orderId, qtys, newStatus === "FULFILLED");
      } else {
        await updateOrderStatus(orderId, newStatus);
      }
      setOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Change
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-5">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg">Update Order</DialogTitle>
          <DialogDescription className="text-sm">
            Order <strong>{orderId.slice(0, 8)}...</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="FULFILLED">Fulfilled</SelectItem>
              <SelectItem value="UNFULFILLED">Unfulfilled</SelectItem>
            </SelectContent>
          </Select>

          {isFulfillmentMode && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Fulfill Quantities</h4>

              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Loading items...
                </p>
              ) : orderItems.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No items
                </p>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Req: {item.requestedQty} • Avail: {item.availableQty}
                        </p>
                      </div>

                      <div className="w-20 sm:w-24">
                        <Input
                          type="number"
                          min={0}
                          max={Math.min(item.requestedQty, item.availableQty)}
                          value={fulfilledQtys[item.productId] ?? "0"}
                          onChange={(e) => handleQtyChange(item.productId, e.target.value)}
                          disabled={loading}
                          className="h-8 text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2.5 rounded-md">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        <DialogFooter className="pt-2 sm:pt-4 gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="flex-1 sm:flex-none p-2"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={
              loading ||
              newStatus === currentStatus ||
              (isFulfillmentMode && (orderItems.length === 0 || loading))
            }
            className="flex-1 sm:flex-none p-2 "
          >
            {loading ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}