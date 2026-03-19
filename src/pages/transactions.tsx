import React, { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { 
  useListTransactions, 
  useCreateTransaction, 
  useUpdateTransaction, 
  useDeleteTransaction,
  getListTransactionsQueryKey,
  getGetBudgetSummaryQueryKey
} from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Edit3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
} from "lucide-react"

const CATEGORIES = ["Housing", "Food", "Transport", "Entertainment", "Healthcare", "Shopping", "Utilities", "Other"]

export default function Transactions() {
  const queryClient = useQueryClient()
  const [monthFilter, setMonthFilter] = useState(format(new Date(), "yyyy-MM"))
  const [categoryFilter, setCategoryFilter] = useState("")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  // Form State
  const [amount, setAmount] = useState("")
  const [type, setType] = useState("expense")
  const [category, setCategory] = useState("Food")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))

  const { data: transactions, isLoading } = useListTransactions({ 
    month: monthFilter || undefined,
    category: categoryFilter || undefined
  })

  const createMut = useCreateTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetBudgetSummaryQueryKey() })
        setIsModalOpen(false)
        resetForm()
      }
    }
  })

  const updateMut = useUpdateTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetBudgetSummaryQueryKey() })
        setIsModalOpen(false)
        resetForm()
      }
    }
  })

  const deleteMut = useDeleteTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetBudgetSummaryQueryKey() })
      }
    }
  })

  const resetForm = () => {
    setAmount("")
    setType("expense")
    setCategory("Food")
    setDescription("")
    setDate(format(new Date(), "yyyy-MM-dd"))
    setEditingId(null)
  }

  const openAddModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (tx: any) => {
    setAmount(tx.amount.toString())
    setType(tx.type)
    setCategory(tx.category)
    setDescription(tx.description)
    setDate(tx.date)
    setEditingId(tx.id)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      amount: parseFloat(amount),
      type,
      category,
      description,
      date
    }

    if (editingId) {
      updateMut.mutate({ id: editingId, data: payload })
    } else {
      createMut.mutate({ data: payload })
    }
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteMut.mutate({ id })
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-1">Manage your income and expenses</p>
        </div>
        <Button onClick={openAddModal} className="h-11 px-6">
          <Plus className="w-5 h-5 mr-2" />
          Add Transaction
        </Button>
      </div>

      <Card className="shadow-lg shadow-black/5 border-card-border">
        <div className="p-4 sm:p-6 border-b border-border bg-card flex flex-col sm:flex-row gap-4 items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Input 
                type="month" 
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full pl-10"
              />
              <Filter className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
            </div>
            <div className="w-full sm:w-48">
              <Select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </div>
          {(monthFilter || categoryFilter) && (
            <Button variant="ghost" onClick={() => { setMonthFilter(""); setCategoryFilter(""); }}>
              Clear Filters
            </Button>
          )}
        </div>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : transactions?.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center text-muted-foreground">
              <Wallet className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground mb-1">No transactions found</h3>
              <p>Try adjusting your filters or add a new transaction.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                    <th className="px-6 py-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions?.map((tx) => (
                    <tr key={tx.id} className="bg-card border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {format(new Date(tx.date), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {tx.description}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`font-bold flex items-center justify-end gap-1 ${tx.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                          {tx.type === 'income' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4 text-rose-500" />}
                          {formatCurrency(tx.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openEditModal(tx)}
                            className="p-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(tx.id)}
                            className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Transaction" : "Add Transaction"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={type} onChange={e => setType(e.target.value)} required>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  required 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input 
              required 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="e.g. Groceries at Whole Foods"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onChange={e => setCategory(e.target.value)} required>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input 
                type="date" 
                required 
                value={date} 
                onChange={e => setDate(e.target.value)} 
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? "Saving..." : "Save Transaction"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
