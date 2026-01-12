// components/inventory/InventoryEditDialog.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { updateInventoryQuantity } from "@/actions/product.actions";

type Props = {
  productId: string;
  name: string;
  currentQty: number;
};

export function InventoryEditDialog({
  productId,
  name,
  currentQty,
}: Props) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(currentQty);
  const [isPending, startTransition] = useTransition();

  async function onSave() {
    if (qty < 0) {
      toast.error("Quantity cannot be negative");
      return;
    }

    startTransition(async () => {
      try {
        await updateInventoryQuantity(
          productId,
          qty,
          "Manual adjustment by stock manager"
        );

        toast.success("Inventory updated successfully");
        setOpen(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to update inventory");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] w-[95vw]">
        <DialogHeader>
          <DialogTitle>Update Quantity</DialogTitle>
          <DialogDescription className="text-sm">
            {name} • Current: {currentQty} units
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3">
            <Label className="sm:text-right">New Quantity</Label>
            <Input
              type="number"
              min="0"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="sm:col-span-3"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
