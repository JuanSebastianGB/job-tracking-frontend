import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Briefcase, LayoutDashboard, PlusCircle, List, Moon, Sun } from "lucide-react";
import Dashboard from "./components/Dashboard";
import JobForm from "./components/JobForm";
import JobList from "./components/JobList";

// === Design Tokens (Phase 1: Foundation & Shared Patterns) ===

// Glassmorphism patterns
const glass = {
  nav: "backdrop-blur-xl bg-white/70 border-b border-white/20 dark:bg-black/30 dark:border-gray-700/50",
  card: "backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl dark:bg-black/30 dark:border-gray-700/50",
  cardStrong: "backdrop-blur-xl bg-white/80 border border-white/30 dark:bg-gray-800/60 dark:border-gray-700/50",
};

// Layered shadow classes
const shadows = {
  card: "shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)]",
  elevated: "shadow-[0_8px_30px_-3px_rgba(0,0,0,0.1)]",
  hover: "shadow-[0_20px_40px_-4px_rgba(0,0,0,0.12)]",
};

// Gradient accent patterns
const gradients = {
  primary: "from-indigo-500 to-purple-500",
  accent: "from-blue-500 to-indigo-500",
};

// Transition utility (applied consistently across all interactive elements)
const transitions = {
  default: "transition-all duration-300 ease-out",
  fast: "transition-all duration-200 ease-out",
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

function AppContent() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "list" | "add">("dashboard");
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Apply dark class on initial mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch("/api/jobs");
      return res.json();
    },
  });

  const handleEdit = (job: any) => {
    setEditingJob(job);
    setActiveTab("add");
  };

  const refreshJobs = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30 text-neutral-900 dark:text-white font-sans">
      <nav className={`sticky top-0 z-10 ${glass.nav} ${shadows.card}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Briefcase className="h-6 w-6 text-indigo-600 mr-2" />
              <span className="font-semibold text-xl tracking-tight">JobTracker</span>
            </div>
            <div className="flex space-x-1 sm:space-x-4 items-center">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center ${transitions.default} ${
                  activeTab === "dashboard" 
                    ? "bg-white/80 text-indigo-600 shadow-sm dark:bg-gray-700/50 dark:text-indigo-400" 
                    : "text-slate-600 dark:text-neutral-400 hover:text-indigo-600 hover:bg-white/50 dark:hover:bg-gray-700/50"
                }`}
              >
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center ${transitions.default} ${
                  activeTab === "list" 
                    ? "bg-white/80 text-indigo-600 shadow-sm dark:bg-gray-700/50 dark:text-indigo-400" 
                    : "text-slate-600 dark:text-neutral-400 hover:text-indigo-600 hover:bg-white/50 dark:hover:bg-gray-700/50"
                }`}
              >
                <List className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Applications</span>
              </button>
              <button
                onClick={() => {
                  setEditingJob(null);
                  setActiveTab("add");
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center ${transitions.default} ${
                  activeTab === "add" 
                    ? "bg-indigo-500 text-white shadow-md" 
                    : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <PlusCircle className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Add Job</span>
              </button>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg text-slate-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-gray-700/50 ${transitions.default}`}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && <Dashboard isLoading={isLoading} />}
        {activeTab === "list" && <JobList jobs={jobs} onEdit={handleEdit} refreshJobs={refreshJobs} />}
        {activeTab === "add" && (
          <JobForm 
            job={editingJob} 
            onSuccess={() => {
              refreshJobs();
              setActiveTab("list");
            }} 
            onCancel={() => setActiveTab("list")}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
