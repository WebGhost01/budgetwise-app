import React, { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { format, subMonths } from "date-fns"
import { 
  useGetBudgetSummary, 
  useListTransactions,
  getGetBudgetSummaryQueryKey,
  getListTransactionsQueryKey
} from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet,
  TrendingUp,
  Plus
} from "lucide-react"
import { Link } from "wouter"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts"

const CATEGORY_COLORS: Record<string, string> = {
  Housing: "#3b82f6", // blue
  Food: "#10b981",    // emerald
  Transport: "#f59e0b",// amber
  Entertainment: "#8b5cf6", // violet
  Healthcare: "#ef4444", // red
  Shopping: "#ec4899", // pink
  Utilities: "#06b6d4", // cyan
  Other: "#64748b",    // slate
}

export default function Dashboard() {
  const [currentMonth] = useState(format(new Date(), "yyyy-MM"))
  
  const { data: summary, isLoading: isLoadingSummary } = useGetBudgetSummary({ month: currentMonth })
  const { data: transactions, isLoading: isLoadingTransactions } = useListTransactions({ month: currentMonth })

  // Prepare data for charts
  const barChartData = summary?.byCategory.map(item => ({
    name: item.category,
    amount: item.total,
    fill: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other
  })).sort((a, b) => b.amount - a.amount) || []

  const pieChartData = summary?.byCategory.map(item => ({
    name: item.category,
    value: item.total,
    fill: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other
  })) || []

  const recentTransactions = transactions?.slice(0, 5) || []

  if (isLoadingSummary || isLoadingTransactions) {
    return <div className="flex h-[50vh] items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview for {format(new Date(), "MMMM yyyy")}</p>
        </div>
        <Link href="/transactions" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 h-11 px-6">
          <Plus className="w-5 h-5 mr-2" />
          Add Transaction
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-card border-none shadow-xl shadow-black/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Net Balance</span>
            </div>
            <h3 className="text-3xl font-display font-bold text-foreground">
              {formatCurrency(summary?.netBalance || 0)}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1 text-primary" />
              Current month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card border-none shadow-xl shadow-black/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Income</span>
            </div>
            <h3 className="text-3xl font-display font-bold text-foreground">
              {formatCurrency(summary?.totalIncome || 0)}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card border-none shadow-xl shadow-black/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Expenses</span>
            </div>
            <h3 className="text-3xl font-display font-bold text-foreground">
              {formatCurrency(summary?.totalExpenses || 0)}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg shadow-black/5 border-card-border">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--secondary))' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <PieChart className="w-12 h-12 mb-3 opacity-20" />
                  <p>No expense data for this month</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg shadow-black/5 border-card-border">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {tx.type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.category} • {format(new Date(tx.date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className={`font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Link href="/transactions" className="w-full block text-center py-2 text-sm font-medium text-primary hover:underline">
                    View All Transactions
                  </Link>
                </div>
              </div>
            ) : (
              <div className="w-full h-[250px] flex flex-col items-center justify-center text-muted-foreground">
                <Wallet className="w-12 h-12 mb-3 opacity-20" />
                <p>No recent transactions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
