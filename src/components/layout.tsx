import React from "react"
import { Link, useLocation } from "wouter"
import { motion } from "framer-motion"
import { 
  LayoutDashboard, 
  Wallet, 
  Target, 
  Settings,
  PieChart,
  LogOut,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: Wallet },
  { name: "Budgets & Goals", href: "/budgets", icon: Target },
  { name: "Analytics", href: "/analytics", icon: PieChart },
]

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.href
        return (
          <Link 
            key={item.name} 
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden",
              isActive 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.div 
                layoutId="activeNavIndicator"
                className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            {item.name}
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-card">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-display font-bold text-xl shadow-lg shadow-primary/20">
            B
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">BudgetWise</span>
        </div>
        
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-4">Menu</p>
          <nav className="flex flex-col gap-1">
            <NavLinks />
          </nav>
        </div>

        <div className="mt-auto p-4">
          <button className="flex w-full items-center gap-3 px-4 py-3 rounded-xl font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/80 backdrop-blur-md z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-display font-bold shadow-md">
            B
          </div>
          <span className="font-display font-bold text-xl">BudgetWise</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-secondary text-foreground"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-4/5 max-w-sm bg-card h-full shadow-2xl flex flex-col"
          >
            <div className="p-4 flex items-center justify-between border-b border-border">
              <span className="font-display font-bold text-xl">Menu</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-2 p-4">
              <NavLinks onClick={() => setIsMobileMenuOpen(false)} />
            </nav>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden lg:pt-0 pt-16">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
