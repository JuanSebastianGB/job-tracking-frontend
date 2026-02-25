import { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Briefcase, LayoutDashboard, PlusCircle, List } from "lucide-react";
import Dashboard from "./components/Dashboard";
import JobForm from "./components/JobForm";
import JobList from "./components/JobList";

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
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Briefcase className="h-6 w-6 text-indigo-600 mr-2" />
              <span className="font-semibold text-xl tracking-tight">JobTracker</span>
            </div>
            <div className="flex space-x-1 sm:space-x-4 items-center">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  activeTab === "dashboard" ? "bg-neutral-100 text-neutral-900" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  activeTab === "list" ? "bg-neutral-100 text-neutral-900" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
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
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  activeTab === "add" ? "bg-indigo-50 text-indigo-700" : "text-indigo-600 hover:bg-indigo-50"
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
