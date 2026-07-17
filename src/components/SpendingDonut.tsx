"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCents } from "@/lib/money";

export default function SpendingDonut({
  data,
  currency = "USD",
}: {
  data: { name: string; amountCents: number; color: string }[];
  currency?: string;
}) {
  if (data.length === 0) {
    return <div className="text-sm text-sage py-8 text-center">No spending logged yet this month.</div>;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-[110px] h-[110px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amountCents"
              nameKey="name"
              innerRadius={34}
              outerRadius={52}
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#1B2A25",
                border: "1px solid #2C4038",
                borderRadius: 8,
                fontSize: 12,
                color: "#EDEAE0",
              }}
              formatter={(value: number, name: string) => [formatCents(value, currency), name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-1.5 text-sm min-w-0 flex-1">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-[2px] shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sage truncate">{entry.name}</span>
            <span className="font-mono text-paper ml-auto">{formatCents(entry.amountCents, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
