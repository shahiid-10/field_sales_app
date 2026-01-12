"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getAllProducts, addStockAdjustment } from "@/actions/product.actions";
import { createMultiItemOrder } from "@/actions/order.actions";

interface CartItem {
  productId: string;
  name: string;
  mrp: number;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  mrp: number;
}

interface Props {
  mode: "visit" | "order";
  storeId: string;
}

const formSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().min(1),
});

export function ProductSelectorDialog({ mode, storeId }: Props) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { productId: "", quantity: 1 },
  });

  const fetchProducts = async () => {
    if (products.length) return;
    setLoading(true);
    setProducts(await getAllProducts());
    setLoading(false);
  };

  const addToCart = () => {
    const { productId, quantity } = form.getValues();
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        { productId, name: product.name, mrp: product.mrp, quantity },
      ];
    });

    form.reset({ productId: "", quantity: 1 });
  };

  const submitOrder = async () => {
    setLoading(true);
    setMessage(null);

    if (mode === "order") {
      const res = await createMultiItemOrder({
        storeId,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });
      if (res.success) {
        setCart([]);
        setMessage("Order placed successfully");
        setOpen(false);
      } else setMessage(res.error || "Failed");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={fetchProducts}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </DialogTrigger>

      <DialogContent
        className="p-0 h-[100dvh] sm:h-auto sm:max-w-lg flex flex-col overflow-hidden"
      >
        {/* Header */}
        <DialogHeader
          className="
      relative
      px-4 py-3
      border-b
      bg-background
      rounded-t-lg
      shrink-0
    "
        >
          <DialogTitle>
            {mode === "order" ? "Place Order" : "Stock Adjustment"}
          </DialogTitle>

          {/* Close Button */}
          {/* <button
            onClick={() => setOpen(false)}
            className="
        absolute right-3 top-3
        rounded-sm opacity-70
        transition-opacity
        hover:opacity-100
        focus:outline-none
        focus:ring-2 focus:ring-ring
      "
          >
            ✕
          </button> */}
        </DialogHeader>

        {/* Scrollable Content */}
        <div
          className="
      flex-1
      overflow-y-auto
      px-4 py-4
      space-y-6
    "
        >
          {/* FORM */}
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                          >
                            {field.value
                              ? products.find((p) => p.id === field.value)?.name
                              : "Select product"}
                          </Button>
                        </FormControl>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[90vw] sm:w-full max-h-64 overflow-auto">
                        {products.map((p) => (
                          <DropdownMenuItem
                            key={p.id}
                            onSelect={() => field.onChange(p.id)}
                          >
                            {p.name} (₹{p.mrp})
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(+e.target.value)}
                    />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={addToCart}
              >
                Add to Order
              </Button>
            </form>
          </Form>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">
                Current Order ({cart.length})
              </h4>

              <ul className="space-y-3">
                {cart.map((item) => (
                  <li
                    key={item.productId}
                    className="flex justify-between items-start gap-3"
                  >
                    <div className="text-sm">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground">
                        × {item.quantity} · ₹{item.quantity * item.mrp}
                      </div>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setCart((prev) =>
                          prev.filter((i) => i.productId !== item.productId)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="
      border-t
      p-4
      bg-background
      rounded-b-lg
      shrink-0
    "
        >
          <Button
            disabled={loading || cart.length === 0}
            onClick={submitOrder}
            className="w-full"
          >
            Place Order ({cart.length})
          </Button>

          {message && (
            <p className="text-center mt-2 text-sm text-muted-foreground">
              {message}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
