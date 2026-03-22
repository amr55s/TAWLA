"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockFlow = [
  { id: 1, date: "2023-11-01", type: "income", description: "Daily POS Sales", amount: 1540.0 },
  { id: 2, date: "2023-11-01", type: "expense", description: "Produce supplier", amount: -450.0 },
  { id: 3, date: "2023-11-02", type: "income", description: "Private Event", amount: 800.0 },
];

const totalRevenue = 2340.0;
const totalExpenses = 450.0;
const netProfit = totalRevenue - totalExpenses;

export default function ProfitLossPage() {
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-2">
        <Link
          href={`/${slug}/admin/analytics`}
          className="w-10 h-10 rounded-xl bg-white border border-[#E8ECF1] flex items-center justify-center text-[#64748B] hover:text-[#0A1628] hover:border-[#0A1628]/20 transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#0A1628] tracking-tight">
            Profit & Loss Statement
          </h1>
          <p className="text-xs text-[#7B8BA3] mt-1">
            Cash flow ledger and net profit calculation
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E8ECF1] p-6">
          <p className="text-[10px] font-bold text-[#7B8BA3] uppercase tracking-widest mb-2">Total Revenue</p>
          <p className="text-2xl font-black text-[#0A1628]">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E8ECF1] p-6">
          <p className="text-[10px] font-bold text-[#7B8BA3] uppercase tracking-widest mb-2">Total Expenses</p>
          <p className="text-2xl font-black text-red-600">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className={`rounded-2xl border p-6 ${netProfit >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${netProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>Net Profit</p>
            {netProfit >= 0 ? <TrendingUp size={16} className="text-emerald-600" /> : <TrendingDown size={16} className="text-red-600" />}
          </div>
          <p className={`text-3xl font-black tracking-tight ${netProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            ${Math.abs(netProfit).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#E8ECF1] overflow-hidden mt-8">
        <div className="p-5 border-b border-[#E8ECF1] bg-[#F8FAFC]">
          <h3 className="font-bold text-[#0A1628]">Cash Flow Ledger</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-[#E8ECF1]">
              <TableHead className="font-semibold text-[#0A1628]">Date</TableHead>
              <TableHead className="font-semibold text-[#0A1628]">Type</TableHead>
              <TableHead className="font-semibold text-[#0A1628]">Description</TableHead>
              <TableHead className="font-semibold text-[#0A1628] text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockFlow.map((row) => (
              <TableRow key={row.id} className="border-[#E8ECF1]">
                <TableCell className="font-medium text-[#0A1628]">{row.date}</TableCell>
                <TableCell>
                  <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${row.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {row.type}
                  </span>
                </TableCell>
                <TableCell className="text-[#64748B]">{row.description}</TableCell>
                <TableCell className={`text-right font-bold ${row.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {row.type === 'income' ? '+' : '-'}${Math.abs(row.amount).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
