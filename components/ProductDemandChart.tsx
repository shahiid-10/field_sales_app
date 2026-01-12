"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Dot,
} from "recharts";

interface DailyDemandData {
  date: string;
  totalDemand: number;
  fulfilled: number;
  shortfall: number;
}

interface ProductDemandChartProps {
  data: DailyDemandData[];
}

export default function ProductDemandChart({
  data,
}: ProductDemandChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="hidden md:flex h-[300px] items-center justify-center text-muted-foreground">
        No demand data available yet
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}:{" "}
            <strong>{entry.value.toLocaleString()}</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Mobile placeholder */}
      <div className="md:hidden text-sm text-muted-foreground text-center py-6">
        Demand trends are available on larger screens
      </div>

      {/* Desktop chart */}
      <div className="hidden md:block w-full h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              angle={-35}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
            />

            <YAxis
              tickFormatter={(v) => v.toLocaleString()}
              tick={{ fontSize: 12 }}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={32} />

            <Line
              type="monotone"
              dataKey="totalDemand"
              name="Total Demand"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={<Dot r={3} />}
            />

            <Line
              type="monotone"
              dataKey="fulfilled"
              name="Fulfilled"
              stroke="#10b981"
              strokeWidth={2}
              dot={<Dot r={3} />}
            />

            <Line
              type="monotone"
              dataKey="shortfall"
              name="Shortfall"
              stroke="#ef4444"
              strokeWidth={2}
              dot={<Dot r={3} />}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
