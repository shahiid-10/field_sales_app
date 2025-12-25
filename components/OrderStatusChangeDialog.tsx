// components/OrderStatusChangeDialog.tsx
"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/actions/order.actions";
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
import { AlertCircle } from "lucide-react";

interface OrderStatusChangeDialogProps {
  orderId: string;
  currentStatus: string;
  storeId: string;
}

export default function OrderStatusChangeDialog({
  orderId,
  currentStatus,
  storeId,
}: OrderStatusChangeDialogProps) {
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("status", newStatus);

    try {
      await updateOrderStatus(orderId, newStatus);
      setOpen(false);
      // Force refresh - in Next.js 14+ you can use router.refresh() instead
    //   window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const needsConfirmation = newStatus === "FULFILLED";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Change Status
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Change status for order <strong>{orderId.slice(0, 8)}...</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="FULFILLED">Fulfilled</SelectItem>
              <SelectItem value="UNFULFILLED">Unfulfilled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {needsConfirmation && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Confirmation Required</p>
                <p className="text-amber-700">
                  Marking as Fulfilled will complete this order permanently.
                  <br />
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={loading || newStatus === currentStatus}
            variant={needsConfirmation ? "destructive" : "default"}
          >
            {loading ? "Updating..." : "Confirm Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}