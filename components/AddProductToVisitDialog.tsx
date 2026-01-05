// components/AddProductToVisitDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Plus, Loader2, CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { addStockAdjustment, getAllProducts } from "@/actions/product.actions";

const formSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  expiryDate: z.date().optional().nullable(),
  batchNumber: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddProductToVisitDialogProps {
  storeId: string;
  onSuccess?: () => void; // Callback to refresh stock list after add
}

export function AddProductToVisitDialog({ storeId, onSuccess }: AddProductToVisitDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      expiryDate: null,
      batchNumber: "",
    },
  });

  // Fetch global products when dialog opens
  useEffect(() => {
    if (isOpen) {
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const allProducts = await getAllProducts();
          setProducts(allProducts);
        } catch (error) {
          toast.error("Failed to load products");
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [isOpen]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
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
        toast.success("Product added to store stock!");
        form.reset();
        setIsOpen(false);
        onSuccess?.(); // Refresh parent stock list
      } else {
        // toast.error(result.error || "Failed to add product");
        // toast.error(
        console.log(result)
        //     typeof result.error === "string"
        //         ? result.error
        //         : "Failed to add product"
        // );
      }
    } catch (error) {
      toast.error("Error adding product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add New Product
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Product to Store</DialogTitle>
          <DialogDescription>
            Select a product and enter stock details for this visit.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} (₹{product.mrp})
                          </option>
                        ))}
                      </select>
                    </FormControl>
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
                      <Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (optional)</FormLabel>
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
                              {field.value ? format(field.value, "PPP") : <span>Pick date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
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
                      <FormLabel>Batch Number (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add to Store Stock"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}