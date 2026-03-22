"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockRevenue = [
  { id: 1, date: "2023-11-01", source: "POS", description: "Dine-in Order #439", amount: 120.5 },
  { id: 2, date: "2023-11-01", source: "Manual", description: "Private Catering", amount: 800.0 },
  { id: 3, date: "2023-11-02", source: "POS", description: "Takeaway Order #440", amount: 45.0 },
];

export default function RevenueDetailsPage() {
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${slug}/admin/analytics`}
          className="w-10 h-10 rounded-xl bg-white border border-[#E8ECF1] flex items-center justify-center text-[#64748B] hover:text-[#0A1628] hover:border-[#0A1628]/20 transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#0A1628] tracking-tight">
            Detailed Revenue
          </h1>
          <p className="text-xs text-[#7B8BA3] mt-1">
            Breakdown of all incoming revenue streams
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-[#E8ECF1] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#F8FAFC]">
            <TableRow className="hover:bg-transparent border-[#E8ECF1]">
              <TableHead className="font-semibold text-[#0A1628]">Date</TableHead>
              <TableHead className="font-semibold text-[#0A1628]">Source</TableHead>
              <TableHead className="font-semibold text-[#0A1628]">Description</TableHead>
              <TableHead className="font-semibold text-[#0A1628] text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockRevenue.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-[#7B8BA3]">
                  No revenue records found.
                </TableCell>
              </TableRow>
            ) : (
              mockRevenue.map((row) => (
                <TableRow key={row.id} className="border-[#E8ECF1]">
                  <TableCell className="font-medium text-[#0A1628]">
                    {row.date}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        row.source === "POS"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-purple-50 text-purple-600"
                      }`}
                    >
                      {row.source}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#64748B]">{row.description}</TableCell>
                  <TableCell className="text-right font-bold text-[#0F4C75]">
                    ${row.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
