import { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Briefcase, LayoutDashboard, PlusCircle, List } from "lucide-react";
import Dashboard from "./components/Dashboard";
import JobForm from "./components/JobForm";
import JobList from "./components/JobList";

// === Design Tokens (Phase 1: Foundation & Shared Patterns) ===

// Glassmorphism patterns
const glass = {
  nav: "backdrop-blur-xl bg-white/70 border-b border-white/20",
  card: "backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl",
  cardStrong: "backdrop-blur-xl bg-white/80 border border-white/30",
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-indigo-50/30 text-neutral-900 font-sans">
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
                    ? "bg-white/80 text-indigo-600 shadow-sm" 
                    : "text-slate-600 hover:text-indigo-600 hover:bg-white/50"
                }`}
              >
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center ${transitions.default} ${
                  activeTab === "list" 
                    ? "bg-white/80 text-indigo-600 shadow-sm" 
                    : "text-slate-600 hover:text-indigo-600 hover:bg-white/50"
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
                    : "text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                <PlusCircle className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Add Job</span>
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
