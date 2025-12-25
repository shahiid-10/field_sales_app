"use client"
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";

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
import { checkInAndUpdateStockPositions } from "@/actions/visit.actions";
import { createOrder } from "@/actions/order.actions";

interface Product {
  id: string;
  name: string;
  mrp: number;
  manufacturer?: string | null;
}

interface ProductSelectorDialogProps {
  mode: "visit" | "order";
  storeId: string;
//   onSuccess: () => void;
}

const formSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  expiryDate: z.date().nullable().optional(),
  batchNumber: z.string().optional(),
});

export function ProductSelectorDialog({
  mode,
  storeId,
//   onSuccess,
}: ProductSelectorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

//   const onSubmit = async (data: z.infer<typeof formSchema>) => {
//     setLoading(true);
//     setMessage(null);

//     const formData = new FormData();
//     formData.append("storeId", storeId);
//     formData.append("productId", data.productId);
//     formData.append("quantity", data.quantity.toString());

//     if (mode === "visit") {
//       if (data.expiryDate) {
//         formData.append("expiryDate", format(data.expiryDate, "yyyy-MM-dd"));
//       }
//       formData.append("batchNumber", data.batchNumber || "");
      
//       const result = await checkInAndUpdateStockPositions(formData);
//       if (result.success) {
//         setMessage("Adjustment added!");
//         onSuccess();
//       } else {
//         setMessage(result.error || "Failed");
//       }
//     } else {
//       const result = await createOrder(formData);
//       if (result.success) {
//         setMessage("Order item added!");
//         onSuccess();
//       } else {
//         setMessage(result.error || "Failed");
//       }
//     }

//     setLoading(false);
//     form.reset();
//     setIsOpen(false);
//   };

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append("storeId", storeId);
        formData.append("productId", data.productId);
        formData.append("quantity", data.quantity.toString());

        let result;

        if (mode === "visit") {
            if (data.expiryDate) {
            formData.append("expiryDate", format(data.expiryDate, "yyyy-MM-dd"));
            }
            if (data.batchNumber?.trim()) {
            formData.append("batchNumber", data.batchNumber.trim());
            }

            result = await addStockAdjustment(formData);
        } else {
            result = await addOrderItem(formData);
        }

        if (result.success) {
            setMessage(mode === "visit" ? "Stock adjustment recorded!" : "Order item added!");
            // onSuccess();
        } else {
            setMessage(result.error || "Failed to add product");
        }

        setLoading(false);
        form.reset();
        // setIsOpen(false);
        };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={fetchProducts}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add Product {mode === "visit" ? "for Stock Adjustment" : "to Order"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p>Loading products...</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            {field.value ? products.find(p => p.id === field.value)?.name : "Select product"}
                          </Button>
                        </FormControl>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full">
                        {products.map((product) => (
                          <DropdownMenuItem
                            key={product.id}
                            onSelect={() => field.onChange(product.id)}
                          >
                            {product.name} (MRP: ₹{product.mrp})
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
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode === "visit" && (
                <>
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value as Date, "PPP")
                                ) : (
                                  <span>Pick date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value as Date | undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="batchNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Adding..." : "Add"}
              </Button>

              {message && <p className="text-center text-sm">{message}</p>}
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}