"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

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
import { MapPin, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { updateStore, deleteStore } from "@/actions/store.actions";

/* ───────────────────────── Schema ───────────────────────── */

const formSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  address: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

type StoreFormValues = z.infer<typeof formSchema>;

type Store = {
  id: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

interface StoreManagementTableProps {
  initialStores: Store[];
}

/* ───────────────────── Component ───────────────────── */

export default function StoreManagementTable({
  initialStores,
}: StoreManagementTableProps) {
  const [stores, setStores] = useState(initialStores);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [deletingStore, setDeletingStore] = useState<Store | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      latitude: undefined,
      longitude: undefined,
    },
  });

  /* ───────────────────── Handlers ───────────────────── */

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    form.reset({
      name: store.name,
      address: store.address ?? "",
      latitude: store.latitude ?? undefined,
      longitude: store.longitude ?? undefined,
    });
  };

  const handleSubmitEdit = async (data: StoreFormValues) => {
    if (!editingStore) return;

    setIsSubmitting(true);
    try {
      const result = await updateStore(editingStore.id, data);

      if (!result.success) {
        toast.error(result.error ?? "Failed to update store");
        return;
      }

      setStores((prev) =>
        prev.map((s) =>
          s.id === editingStore.id ? { ...s, ...data } : s
        )
      );

      toast.success("Store updated successfully");
      setEditingStore(null);
      form.reset();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStore) return;

    setIsSubmitting(true);
    try {
      const result = await deleteStore(deletingStore.id);

      if (!result.success) {
        toast.error(result.error ?? "Failed to delete store");
        return;
      }

      setStores((prev) => prev.filter((s) => s.id !== deletingStore.id));
      toast.success("Store deleted successfully");
      setDeletingStore(null);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ───────────────────── UI ───────────────────── */

  return (

    <div className="space-y-4">
      {/* ───────────── Mobile Cards ───────────── */}
      <div className="md:hidden space-y-3">
        {stores.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No stores added yet.
          </p>
        )}

        {stores.map((store) => (
          <div
            key={store.id}
            className="rounded-lg border p-4 space-y-2 bg-background"
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="font-medium">{store.name}</p>
                <p className="text-sm text-muted-foreground">
                  {store.address || "—"}
                </p>
                {store.latitude != null && store.longitude != null && (
                  <div className="flex items-center gap-1 text-sm mt-1">
                    <MapPin className="h-3 w-3" />
                    {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEdit(store)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setDeletingStore(store)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ───────────── Desktop Table ───────────── */}
      <div className="hidden md:block rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {stores.map((store) => (
              <TableRow key={store.id}>
                <TableCell className="font-medium">{store.name}</TableCell>
                <TableCell>{store.address || "—"}</TableCell>
                <TableCell>
                  {store.latitude != null && store.longitude != null ? (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      {store.latitude.toFixed(5)},{" "}
                      {store.longitude.toFixed(5)}
                    </div>
                  ) : (
                    "Not set"
                  )}
                </TableCell>

                <TableCell className="text-right space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(store)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setDeletingStore(store)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ───────────── Edit Dialog ───────────── */}
      <Dialog open={!!editingStore} onOpenChange={() => setEditingStore(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Store</DialogTitle>
            <DialogDescription>Update store details</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmitEdit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["latitude", "longitude"] as const).map((key) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name={key}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {key === "latitude" ? "Latitude" : "Longitude"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            value={
                              typeof field.value === "number" ? field.value : ""
                            }
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingStore(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ───────────── Delete Dialog ───────────── */}
      <Dialog
        open={!!deletingStore}
        onOpenChange={() => setDeletingStore(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Store</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingStore?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingStore(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    // <div className="rounded-lg border bg-background">
    //   <div className="overflow-x-auto">
    //     <Table className="min-w-[640px]">
    //       <TableHeader>
    //         <TableRow>
    //           <TableHead>Name</TableHead>
    //           <TableHead className="hidden md:table-cell">Address</TableHead>
    //           <TableHead className="hidden lg:table-cell">Location</TableHead>
    //           <TableHead className="text-right">Actions</TableHead>
    //         </TableRow>
    //       </TableHeader>

    //       <TableBody>
    //         {stores.length === 0 ? (
    //           <TableRow>
    //             <TableCell
    //               colSpan={4}
    //               className="text-center py-10 text-muted-foreground"
    //             >
    //               No stores added yet.
    //             </TableCell>
    //           </TableRow>
    //         ) : (
    //           stores.map((store) => (
    //             <TableRow
    //               key={store.id}
    //               className="align-top md:align-middle"
    //             >
    //               {/* Name + mobile meta */}
    //               <TableCell className="space-y-1">
    //                 <p className="font-medium">{store.name}</p>

    //                 {/* Mobile only */}
    //                 <div className="md:hidden text-sm text-muted-foreground space-y-1">
    //                   <p>{store.address || "—"}</p>
    //                   {store.latitude != null &&
    //                   store.longitude != null ? (
    //                     <div className="flex items-center gap-1">
    //                       <MapPin className="h-3 w-3" />
    //                       {store.latitude.toFixed(4)},{" "}
    //                       {store.longitude.toFixed(4)}
    //                     </div>
    //                   ) : (
    //                     <span>Location not set</span>
    //                   )}
    //                 </div>
    //               </TableCell>

    //               {/* Address */}
    //               <TableCell className="hidden md:table-cell max-w-xs truncate">
    //                 {store.address || (
    //                   <span className="text-muted-foreground">—</span>
    //                 )}
    //               </TableCell>

    //               {/* Location */}
    //               <TableCell className="hidden lg:table-cell text-sm">
    //                 {store.latitude != null && store.longitude != null ? (
    //                   <div className="flex items-center gap-2">
    //                     <MapPin className="h-4 w-4 text-muted-foreground" />
    //                     {store.latitude.toFixed(5)},{" "}
    //                     {store.longitude.toFixed(5)}
    //                   </div>
    //                 ) : (
    //                   <span className="text-muted-foreground">Not set</span>
    //                 )}
    //               </TableCell>

    //               {/* Actions */}
    //               <TableCell className="text-right">
    //                 <div className="flex justify-end gap-2">
    //                   {/* Edit */}
    //                   <Dialog
    //                     open={editingStore?.id === store.id}
    //                     onOpenChange={(open) => {
    //                       if (!open) {
    //                         setEditingStore(null);
    //                         form.reset();
    //                       }
    //                     }}
    //                   >
    //                     <DialogTrigger asChild>
    //                       <Button
    //                         variant="ghost"
    //                         size="icon"
    //                         onClick={() => handleEdit(store)}
    //                       >
    //                         <Pencil className="h-4 w-4" />
    //                       </Button>
    //                     </DialogTrigger>

    //                     <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
    //                       <DialogHeader>
    //                         <DialogTitle>Edit Store</DialogTitle>
    //                         <DialogDescription>
    //                           Update store details
    //                         </DialogDescription>
    //                       </DialogHeader>

    //                       <Form {...form}>
    //                         <form
    //                           onSubmit={form.handleSubmit(handleSubmitEdit)}
    //                           className="space-y-5"
    //                         >
    //                           <FormField
    //                             control={form.control}
    //                             name="name"
    //                             render={({ field }) => (
    //                               <FormItem>
    //                                 <FormLabel>Store Name *</FormLabel>
    //                                 <FormControl>
    //                                   <Input {...field} />
    //                                 </FormControl>
    //                                 <FormMessage />
    //                               </FormItem>
    //                             )}
    //                           />

    //                           <FormField
    //                             control={form.control}
    //                             name="address"
    //                             render={({ field }) => (
    //                               <FormItem>
    //                                 <FormLabel>Address</FormLabel>
    //                                 <FormControl>
    //                                   <Input {...field} />
    //                                 </FormControl>
    //                               </FormItem>
    //                             )}
    //                           />

    //                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    //                             {(["latitude", "longitude"] as const).map(
    //                               (key) => (
    //                                 <FormField
    //                                   key={key}
    //                                   control={form.control}
    //                                   name={key}
    //                                   render={({ field }) => (
    //                                     <FormItem>
    //                                       <FormLabel>
    //                                         {key === "latitude"
    //                                           ? "Latitude"
    //                                           : "Longitude"}
    //                                       </FormLabel>
    //                                       <FormControl>
    //                                         <Input
    //                                           type="number"
    //                                           step="any"
    //                                           value={
    //                                             typeof field.value === "number"
    //                                               ? field.value
    //                                               : ""
    //                                           }
    //                                           onChange={(e) =>
    //                                             field.onChange(
    //                                               e.target.value === ""
    //                                                 ? undefined
    //                                                 : Number(e.target.value)
    //                                             )
    //                                           }
    //                                         />
    //                                       </FormControl>
    //                                       <FormMessage />
    //                                     </FormItem>
    //                                   )}
    //                                 />
    //                               )
    //                             )}
    //                           </div>

    //                           <DialogFooter className="gap-2 sm:gap-0">
    //                             <Button
    //                               type="button"
    //                               variant="outline"
    //                               onClick={() => setEditingStore(null)}
    //                             >
    //                               Cancel
    //                             </Button>
    //                             <Button
    //                               type="submit"
    //                               disabled={isSubmitting}
    //                             >
    //                               {isSubmitting ? "Saving..." : "Save"}
    //                             </Button>
    //                           </DialogFooter>
    //                         </form>
    //                       </Form>
    //                     </DialogContent>
    //                   </Dialog>

    //                   {/* Delete */}
    //                   <Dialog
    //                     open={deletingStore?.id === store.id}
    //                     onOpenChange={(open) =>
    //                       !open && setDeletingStore(null)
    //                     }
    //                   >
    //                     <DialogTrigger asChild>
    //                       <Button
    //                         variant="ghost"
    //                         size="icon"
    //                         className="text-destructive"
    //                         onClick={() => setDeletingStore(store)}
    //                       >
    //                         <Trash2 className="h-4 w-4" />
    //                       </Button>
    //                     </DialogTrigger>

    //                     <DialogContent className="sm:max-w-sm">
    //                       <DialogHeader>
    //                         <DialogTitle>Delete Store</DialogTitle>
    //                         <DialogDescription>
    //                           Are you sure you want to delete{" "}
    //                           <strong>{deletingStore?.name}</strong>?
    //                         </DialogDescription>
    //                       </DialogHeader>

    //                       <DialogFooter>
    //                         <Button
    //                           variant="outline"
    //                           onClick={() => setDeletingStore(null)}
    //                         >
    //                           Cancel
    //                         </Button>
    //                         <Button
    //                           variant="destructive"
    //                           onClick={handleDelete}
    //                           disabled={isSubmitting}
    //                         >
    //                           Delete
    //                         </Button>
    //                       </DialogFooter>
    //                     </DialogContent>
    //                   </Dialog>
    //                 </div>
    //               </TableCell>
    //             </TableRow>
    //           ))
    //         )}
    //       </TableBody>
    //     </Table>
    //   </div>
    // </div>
  );
}
