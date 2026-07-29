"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { CurrencyCode } from "@/lib/model";
import { money } from "@/lib/model";

export default function MarketPriceChart({
  chartData,
  currencyCode
}: {
  chartData: Array<{ year: number; variation: number; sellingPrice: number }>;
  currencyCode: CurrencyCode;
}) {
  return (
    <div
      className="h-[320px] min-h-[320px] min-w-0 sm:h-[360px]"
      role="img"
      aria-label={`Line chart showing selected property selling price from Year 0 through Year ${chartData.at(-1)?.year ?? 0} in ${currencyCode}.`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={300}>
        <LineChart data={chartData} margin={{ top: 12, right: 18, bottom: 12, left: 0 }}>
          <CartesianGrid stroke="#CBD5E1" strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            label={{ value: "Year", position: "insideBottom", offset: -8 }}
            tick={{ fill: "#334155", fontSize: 12 }}
            axisLine={{ stroke: "#94A3B8" }}
            tickLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#334155", fontSize: 12 }}
            axisLine={{ stroke: "#94A3B8" }}
            tickLine={false}
            width={78}
            tickFormatter={(value) => compactMoney(Number(value), currencyCode)}
          />
          <Tooltip
            formatter={(value) => [
              money(typeof value === "number" ? value : Number(value), currencyCode),
              "Selling price"
            ]}
            labelFormatter={(label) => `Year ${label}`}
          />
          <Line
            type="monotone"
            dataKey="sellingPrice"
            name="Selling price"
            stroke="#0F766E"
            strokeWidth={2.6}
            dot={{ r: 3, fill: "#ffffff", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function compactMoney(value: number, currencyCode: CurrencyCode): string {
  const formatted = new Intl.NumberFormat("en", {
    notation: Math.abs(value) >= 100_000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(value);
  return `${currencyCode} ${formatted}`;
}
