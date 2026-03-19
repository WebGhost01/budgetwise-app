import React, { useState, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { 
  useListBudgetGoals, 
  useCreateBudgetGoal,
  useUpdateBudgetGoal,
  useDeleteBudgetGoal,
  useGetBudgetSummary,
  getListBudgetGoalsQueryKey,
} from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { 
  Target,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle
} from "lucide-react"

const CATEGORIES = ["Housing", "Food", "Transport", "Entertainment", "Healthcare", "Shopping", "Utilities", "Other"]

export default function Budgets() {
  const queryClient = useQueryClient()
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "yyyy-MM"))
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  // Form State
  const [category, setCategory] = useState(CATEGORIES[0])
  const [limit, setLimit] = useState("")

  const { data: goals, isLoading: isLoadingGoals } = useListBudgetGoals()
  const { data: summary, isLoading: isLoadingSummary } = useGetBudgetSummary({ month: currentMonth })

  const currentMonthGoals = useMemo(() => {
    return goals?.filter(g => g.month === currentMonth) || []
  }, [goals, currentMonth])

  const progressData = useMemo(() => {
    return currentMonthGoals.map(goal => {
      const actualSpent = summary?.byCategory.find(c => c.category === goal.category)?.total || 0
      const percentage = formatPercentage(actualSpent, goal.monthlyLimit)
      return {
        ...goal,
        actualSpent,
        percentage,
        isOver: actualSpent > goal.monthlyLimit
      }
    }).sort((a, b) => b.percentage - a.percentage)
  }, [currentMonthGoals, summary])

  const createMut = useCreateBudgetGoal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBudgetGoalsQueryKey() })
        setIsModalOpen(false)
        resetForm()
      }
    }
  })

  const updateMut = useUpdateBudgetGoal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBudgetGoalsQueryKey() })
        setIsModalOpen(false)
        resetForm()
      }
    }
  })

  const deleteMut = useDeleteBudgetGoal({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBudgetGoalsQueryKey() })
    }
  })

  const resetForm = () => {
    setCategory(CATEGORIES[0])
    setLimit("")
    setEditingId(null)
  }

  const openAddModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (goal: any) => {
    setCategory(goal.category)
    setLimit(goal.monthlyLimit.toString())
    setEditingId(goal.id)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      category,
      monthlyLimit: parseFloat(limit),
      month: currentMonth
    }

    if (editingId) {
      updateMut.mutate({ id: editingId, data: payload })
    } else {
      // Check if goal for category already exists for this month
      const existing = currentMonthGoals.find(g => g.category === category)
      if (existing) {
        alert(`A goal for ${category} already exists for this month. Please edit it instead.`)
        return
      }
      createMut.mutate({ data: payload })
    }
  }

  if (isLoadingGoals || isLoadingSummary) {
    return <div className="flex h-[50vh] items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Budgets & Goals</h1>
          <p className="text-muted-foreground mt-1">Set limits to keep your spending in check</p>
        </div>
        <div className="flex items-center gap-3">
          <Input 
            type="month" 
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="w-48"
          />
          <Button onClick={openAddModal} className="h-11">
            <Plus className="w-5 h-5 mr-2" />
            Set New Goal
          </Button>
        </div>
      </div>

      {progressData.length === 0 ? (
        <Card className="border-dashed border-2 border-border bg-transparent shadow-none">
          <div className="flex flex-col h-[400px] items-center justify-center text-muted-foreground">
            <Target className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-display font-bold text-foreground mb-2">No goals set for this month</h3>
            <p className="mb-6 max-w-md text-center">Creating budget goals helps you track where your money goes and stay within your limits.</p>
            <Button onClick={openAddModal}>Create Your First Goal</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {progressData.map((goal) => (
            <Card key={goal.id} className="shadow-lg shadow-black/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      {goal.category}
                      {goal.isOver && <AlertTriangle className="w-4 h-4 text-destructive" />}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(goal.actualSpent)} spent of {formatCurrency(goal.monthlyLimit)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(goal)} className="p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if(confirm("Delete goal?")) deleteMut.mutate({ id: goal.id }) }} className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className={goal.isOver ? "text-destructive" : "text-foreground"}>
                      {goal.percentage}%
                    </span>
                    <span className="text-muted-foreground">
                      {goal.isOver ? "Over budget" : `${formatCurrency(goal.monthlyLimit - goal.actualSpent)} left`}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out",
                        goal.percentage < 75 ? "bg-emerald-500" : goal.percentage < 100 ? "bg-amber-500" : "bg-destructive"
                      )}
                      style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Goal" : "Set Budget Goal"}
        description={`For ${format(new Date(currentMonth + "-01"), "MMMM yyyy")}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              required
              disabled={!!editingId} // Don't allow changing category when editing
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Monthly Limit</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-muted-foreground">$</span>
              <Input 
                type="number" 
                step="1" 
                min="1"
                required 
                value={limit} 
                onChange={e => setLimit(e.target.value)} 
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? "Saving..." : "Save Goal"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
