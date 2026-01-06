// components/StockPositionUpdateForm.tsx


// components/StockPositionUpdateForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { checkInAndUpdateStockPositions } from "@/actions/visit.actions";

// Zod schema — lat/long required, quantities >=0
const createFormSchema = (productIds: string[]) => {
  const shape: Record<string, z.ZodTypeAny> = {
    storeId: z.string().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  };

  productIds.forEach((productId) => {
    shape[`quantity-${productId}`] = z.coerce
      .number()
      .min(0, { message: "Quantity must be at least 0" });
    shape[`expiry-${productId}`] = z.date().optional().nullable();
    shape[`batch-${productId}`] = z.string().optional();
  });

  return z.object(shape);
};

interface StockPositionUpdateFormProps {
  storeId: string;
  stockPositions: Array<{
    productId: string;
    product: { name: string; mrp: number };
    quantity: number;
    expiryDate: Date | null;
    batchNumber: string | null;
  }>;
}

export function StockPositionUpdateForm({
  storeId,
  stockPositions,
}: StockPositionUpdateFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const productIds = stockPositions.map((sp) => sp.productId);
  const schema = createFormSchema(productIds);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeId,
      latitude: 0, // will be set by geolocation
      longitude: 0,
      ...stockPositions.reduce(
        (acc, sp) => ({
          ...acc,
          [`quantity-${sp.productId}`]: sp.quantity,
          [`expiry-${sp.productId}`]: sp.expiryDate ? new Date(sp.expiryDate) : null,
          [`batch-${sp.productId}`]: sp.batchNumber || "",
        }),
        {}
      ),
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setLoading(true);
    setMessage(null);


    const formData = new FormData();
    const storeId = data.storeId as string;
    const latitude = data.latitude as number;
    const longitude = data.longitude as number;

    formData.append("storeId", storeId);
    formData.append("latitude", latitude.toString());
    formData.append("longitude", longitude.toString());

    productIds.forEach((productId) => {
      formData.append(
        `quantity-${productId}`,
        String(data[`quantity-${productId}` as keyof typeof data] ?? 0)
      );

      const expiry = data[`expiry-${productId}` as keyof typeof data] as Date | null;
      if (expiry) {
        formData.append(`expiry-${productId}`, format(expiry, "yyyy-MM-dd"));
      }

      const batch = data[`batch-${productId}` as keyof typeof data] as string;
      if (batch?.trim()) {
        formData.append(`batch-${productId}`, batch.trim());
      }
    });

    const result = await checkInAndUpdateStockPositions(formData);

    if (result.success) {
      setMessage("Visit recorded and stock adjustments saved successfully!");
      form.reset();
    } else {
      // setMessage(result.error || "Something went wrong. Please try again.");
      console.log("something went wrong - StockPositionUpdateForm")
    }

    setLoading(false);
  };

  const handleGeolocationSubmit = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("latitude", position.coords.latitude, { shouldValidate: false });
        form.setValue("longitude", position.coords.longitude, { shouldValidate: false });

        // Auto-submit after location is captured
        form.handleSubmit(onSubmit)();
      },
      (error) => {
        setMessage("Location access denied. Please allow location permission.",);
        console.log(error)
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (!isMounted) {
    return <div className="p-8 text-center text-muted-foreground">Loading form...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
          <p>Click "Submit Visit" to capture your current location</p>
          <p className="text-xs mt-1">You must be within ~200 meters of the store</p>
        </div>

        {stockPositions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No products available for this store yet.
          </p>
        ) : (
          <div className="space-y-6">
            {stockPositions.map((sp) => (
              <div key={sp.productId} className="border rounded-lg p-5 shadow-sm">
                <h3 className="font-medium mb-4 text-lg">
                  {sp.product.name} <span className="text-sm text-muted-foreground">(MRP: ₹{sp.product.mrp})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <FormField
                    control={form.control}
                    name={`quantity-${sp.productId}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            value={(field.value as string) ?? ""}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`expiry-${sp.productId}`}
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
                                {field.value ? format(field.value as Date, "PPP") : <span>Pick date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value as Date | undefined}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date("2020-01-01")}
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
                    name={`batch-${sp.productId}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Number</FormLabel>
                        <FormControl>
                          <Input {...field} 
                          value={(field.value as string) ?? ""} 
                        />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          onClick={handleGeolocationSubmit}
          disabled={loading || form.formState.isSubmitting}
          className="w-full py-6 text-lg"
        >
          {loading ? "Processing..." : "Submit Visit & Save Adjustments"}
        </Button>

        {message && (
          <p
            className={cn(
              "text-center font-medium py-2 px-4 rounded-md",
              message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            )}
          >
            {message}
          </p>
        )}
      </form>
    </Form>
  );
}
// "use client";


// import { useEffect, useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { format } from "date-fns";
// import { CalendarIcon } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { cn } from "@/lib/utils";
// import { checkInAndUpdateStockPositions } from "@/actions/visit.actions";

// // Define Zod schema dynamically
// const createFormSchema = (productIds: string[]) => {
//   const shape: Record<string, z.ZodTypeAny> = {
//     storeId: z.string(),
//     latitude: z.number(),
//     longitude: z.number(),
//   };

//   productIds.forEach((productId) => {
//     shape[`quantity-${productId}`] = z.coerce
//       .number()
//       .min(0, { message: "Quantity must be at least 0" });
//     shape[`expiry-${productId}`] = z.date().optional().nullable();
//     shape[`batch-${productId}`] = z.string().optional();
//   });

//   return z.object(shape);
// };

// interface StockPositionUpdateFormProps {
//   storeId: string;
//   stockPositions: Array<{
//     productId: string;
//     product: { name: string; mrp: number };
//     quantity: number;
//     expiryDate: Date | null;
//     batchNumber: string | null;
//   }>;
// }

// export function StockPositionUpdateForm({
//   storeId,
//   stockPositions,
// }: StockPositionUpdateFormProps) {
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState<string | null>(null);
//   const [isMounted, setIsMounted] = useState(false);

//   // All hooks must be called unconditionally
//   const productIds = stockPositions.map((sp) => sp.productId);
//   const schema = createFormSchema(productIds);

//   const form = useForm<z.infer<typeof schema>>({
//     resolver: zodResolver(schema),
//     defaultValues: {
//       storeId,
//       ...stockPositions.reduce(
//         (acc, sp) => ({
//           ...acc,
//           [`quantity-${sp.productId}`]: sp.quantity,
//           [`expiry-${sp.productId}`]: sp.expiryDate
//             ? new Date(sp.expiryDate)
//             : null,
//           [`batch-${sp.productId}`]: sp.batchNumber || "",
//         }),
//         {}
//       ),
//     },
//   });

//   useEffect(() => {
//     setIsMounted(true);
//   }, []);

//   const onSubmit = async (data: z.infer<typeof schema>) => {
//     setLoading(true);
//     setMessage(null);


//     const formData = new FormData();
//     const storeId = data.storeId as string;
//     const latitude = data.latitude as number;
//     const longitude = data.longitude as number;

//     formData.append("storeId", storeId);
//     formData.append("latitude", latitude.toString());
//     formData.append("longitude", longitude.toString());

//     productIds.forEach((productId) => {
//       formData.append(
//         `quantity-${productId}`,
//         String(data[`quantity-${productId}` as keyof typeof data])
//       );
//       const expiry = data[`expiry-${productId}` as keyof typeof data] as Date | null;
//       if (expiry) formData.append(`expiry-${productId}`, format(expiry, "yyyy-MM-dd"));
//       const batch = data[`batch-${productId}` as keyof typeof data] as string;
//       if (batch) formData.append(`batch-${productId}`, batch);
//     });

//     const result = await checkInAndUpdateStockPositions(formData);

//     if (result.success) {
//       setMessage("Visit recorded & stock updated successfully!");
//       form.reset();
//     } else {
//       setMessage(result.error || "Update failed");
//     }

//     setLoading(false);
//   };

//   const handleGeolocationSubmit = () => {
//     if (!navigator.geolocation) {
//       setMessage("Geolocation not supported");
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         form.setValue("latitude", position.coords.latitude);
//         form.setValue("longitude", position.coords.longitude);
//         form.handleSubmit(onSubmit)();
//       },
//       () => setMessage("Please allow location access"),
//       { enableHighAccuracy: true }
//     );
//   };

//   // Conditional rendering AFTER all hooks
//   if (!isMounted) {
//     return <div className="p-8 text-center text-muted-foreground">Loading form...</div>;
//   }

//   return (
//     <Form {...form}>
//       <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
//         <div className="bg-muted p-4 rounded-lg">
//           <p className="text-sm text-muted-foreground">
//             Click Submit to capture location (must be within ~200m of store)
//           </p>
//         </div>

//         {stockPositions.length === 0 ? (
//           <p className="text-muted-foreground">No products to update yet.</p>
//         ) : (
//           <div className="space-y-6">
//             {stockPositions.map((sp) => (
//               <div key={sp.productId} className="border rounded-lg p-4">
//                 <h3 className="font-medium mb-3">
//                   {sp.product.name} (MRP: ₹{sp.product.mrp})
//                 </h3>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <FormField
//                     control={form.control}
//                     name={`quantity-${sp.productId}`}
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Quantity</FormLabel>
//                         <FormControl>
//                           <Input
//                             type="number"
//                             min={0}
//                             value={(field.value as string) ?? ""}
//                             onChange={(e) => field.onChange(Number(e.target.value))}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name={`expiry-${sp.productId}`}
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Expiry Date</FormLabel>
//                         <Popover>
//                           <PopoverTrigger asChild>
//                             <FormControl>
//                               <Button
//                                 variant="outline"
//                                 className={cn(
//                                   "w-full justify-start text-left font-normal",
//                                   !field.value && "text-muted-foreground"
//                                 )}
//                               >
//                                 {field.value ? format(field.value as Date, "PPP") : <span>Pick date</span>}
//                                 <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
//                               </Button>
//                             </FormControl>
//                           </PopoverTrigger>
//                           <PopoverContent className="w-auto p-0">
//                             <Calendar
//                               mode="single"
//                               selected={field.value as Date | undefined}
//                               onSelect={field.onChange}
//                               disabled={(date) => date < new Date("1900-01-01")}
//                               initialFocus
//                             />
//                           </PopoverContent>
//                         </Popover>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name={`batch-${sp.productId}`}
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Batch Number</FormLabel>
//                         <FormControl>
//                           <Input
//                             value={(field.value as string) ?? ""}
//                             onChange={field.onChange}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         <Button
//           type="button"
//           onClick={handleGeolocationSubmit}
//           disabled={loading || form.formState.isSubmitting}
//           className="w-full"
//         >
//           {loading ? "Processing..." : "Submit Visit & Update Stock"}
//         </Button>

//         {message && (
//           <p
//             className={cn(
//               "text-center font-medium",
//               message.includes("success") ? "text-green-600" : "text-destructive"
//             )}
//           >
//             {message}
//           </p>
//         )}
//       </form>
//     </Form>
//   );
// }