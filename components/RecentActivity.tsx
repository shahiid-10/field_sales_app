// components/RecentActivity.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

type Activity = {
  id: string;
  createdAt: string;
  type: string;
  description: string;
};

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/activities?limit=10", {
        cache: "no-store", // always fresh
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setActivities(data);
      setError(null);
    } catch (err) {
      setError("Failed to load recent activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(); // Initial fetch

    const interval = setInterval(fetchActivities, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {loading && activities.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <p className="text-destructive text-center py-8">{error}</p>
      ) : activities.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No recent activity
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((act) => (
                <TableRow key={act.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {format(new Date(act.createdAt), "MMM d, h:mm a")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {act.type.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{act.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}