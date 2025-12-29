"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { addOrderItem, addStockAdjustment, getAllProducts } from "@/actions/product.actions";
import { createMultiItemOrder } from "@/actions/order.actions";

// New: Cart for multi-item orders
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
  manufacturer?: string | null;
}

interface ProductSelectorDialogProps {
  mode: "visit" | "order";
  storeId: string;
}

const formSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  expiryDate: z.date().nullable().optional(),
  batchNumber: z.string().optional(),
});

export function ProductSelectorDialog({ mode, storeId }: ProductSelectorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]); // only used in order mode

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      expiryDate: null,
      batchNumber: "",
    },
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const allProducts = await getAllProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
    setLoading(false);
  };

  const addToCart = () => {
    const data = form.getValues();
    const product = products.find((p) => p.id === data.productId);
    if (!product) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === data.productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === data.productId
            ? { ...item, quantity: item.quantity + data.quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: data.productId,
          name: product.name,
          mrp: product.mrp,
          quantity: data.quantity,
        },
      ];
    });

    form.reset();
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const onSubmit = async () => {
    setLoading(true);
    setMessage(null);

    if (mode === "visit") {
      // Single item for visit (your existing logic)
      const data = form.getValues();
      const formData = new FormData();
      formData.append("storeId", storeId);
      formData.append("productId", data.productId);
      formData.append("quantity", data.quantity.toString());

      if (data.expiryDate) {
        formData.append("expiryDate", format(data.expiryDate, "yyyy-MM-dd"));
      }
      if (data.batchNumber?.trim()) {
        formData.append("batchNumber", data.batchNumber.trim());
      }

      const result = await addStockAdjustment(formData);

      if (result.success) {
        setMessage("Stock adjustment recorded!");
      } else {
        setMessage(result.error || "Failed to add adjustment");
      }
    } else {
      // Multi-item for order
      if (cart.length === 0) {
        setMessage("Add at least one product to the order");
        setLoading(false);
        return;
      }

      // You can either:
      // 1. Create one order with multiple items (recommended)
      // 2. Loop and create single-item orders (if you prefer keeping backend simple)

      // Example: Create one order with multiple items
      // (You'll need a new server action for this - see below)
      const result = await createMultiItemOrder({
        storeId,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      if (result.success) {
        setMessage("Order placed successfully!");
        setCart([]);
      } else {
        setMessage(result.error || "Failed to place order");
      }
    }

    setLoading(false);
    form.reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={fetchProducts}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "visit" ? "Stock Adjustment" : "Place Order"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* Product Selector */}
            <Form {...form}>
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className="w-full justify-start">
                              {field.value ? products.find((p) => p.id === field.value)?.name : "Select product"}
                            </Button>
                          </FormControl>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full max-h-60 overflow-auto">
                          {products.map((product) => (
                            <DropdownMenuItem
                              key={product.id}
                              onSelect={() => field.onChange(product.id)}
                            >
                              {product.name} (₹{product.mrp})
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
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {mode === "visit" && (
                  <>
                    {/* Expiry & Batch fields - same as before */}
                    {/* ... your existing expiryDate and batchNumber fields ... */}
                  </>
                )}

                {/* Add to Cart / Add Button */}
                <Button
                  type="button"
                  onClick={() => {
                    form.handleSubmit(addToCart)(); // ← safe call
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  Add to {mode === "visit" ? "Adjustment" : "Order"}
                </Button>
              </form>
            </Form>

            {/* Cart Preview (only for order mode) */}
            {mode === "order" && cart.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h4 className="font-medium mb-3">Current Order ({cart.length} items)</h4>
                <ul className="space-y-3">
                  {cart.map((item) => (
                    <li key={item.productId} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          × {item.quantity} (₹{item.mrp * item.quantity})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Final Submit Button */}
            <Button
              type="button"
              onClick={onSubmit}
              disabled={loading || (mode === "order" && cart.length === 0)}
              className="w-full mt-6"
            >
              {loading
                ? "Processing..."
                : mode === "order"
                ? `Place Order (${cart.length} items)`
                : "Confirm Adjustment"}
            </Button>

            {message && (
              <p className={cn("text-center mt-4 text-sm", message.includes("success") ? "text-green-600" : "text-red-600")}>
                {message}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}