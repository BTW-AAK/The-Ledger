"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatCents } from "@/lib/money";

export default function NetWorthChart({
  data,
  currency = "USD",
}: {
  data: { date: string; netWorthCents: number }[];
  currency?: string;
}) {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C99A4E" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#C99A4E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#22332C" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#8FA39A", fontSize: 11 }}
            axisLine={{ stroke: "#2C4038" }}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "#1B2A25",
              border: "1px solid #2C4038",
              borderRadius: 8,
              fontSize: 12,
              color: "#EDEAE0",
            }}
            formatter={(value: number) => [formatCents(value, currency), "Net worth"]}
          />
          <Area
            type="monotone"
            dataKey="netWorthCents"
            stroke="#C99A4E"
            strokeWidth={2}
            fill="url(#netWorthFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
