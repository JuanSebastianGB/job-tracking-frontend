import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { ExternalLink, Edit2, Trash2, MapPin, DollarSign, Calendar, Building2, Search, FileText, Image as ImageIcon, Download } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryClient";
import { exportJobs, downloadBlob, type ExportFormat } from "../lib/api";
import { InlineLoader } from "./InlineLoader";

interface Job {
  id: number;
  title: string;
  company: string;
  url?: string;
  date_applied: string;
  status: string;
  work_model?: string;
  salary_range?: string;
  salary_frequency?: string;
  tech_stack?: string[];
  notes?: string;
  screenshot_url?: string;
  resume_url?: string;
  cover_letter_url?: string;
  attachments?: Array<{ name: string; url: string }>;
}

interface DeletedJobState {
  [jobId: number]: "deleting" | "deleted";
}

const STATUS_COLORS: Record<string, string> = {
  "Saved": "bg-white/60 backdrop-blur-sm text-neutral-700 border border-white/30 dark:bg-gray-800/60 dark:text-neutral-300 dark:border-gray-700/50",
  "Applied": "bg-white/60 backdrop-blur-sm text-blue-700 border border-blue-200/50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50",
  "Interview": "bg-white/60 backdrop-blur-sm text-purple-700 border border-purple-200/50 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50",
  "Technical Test": "bg-white/60 backdrop-blur-sm text-orange-700 border border-orange-200/50 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50",
  "Offer": "bg-white/60 backdrop-blur-sm text-green-700 border border-green-200/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50",
  "Rejected": "bg-white/60 backdrop-blur-sm text-red-700 border border-red-200/50 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50",
};

export default function JobList({ jobs, onEdit, refreshJobs }: { jobs: any[], onEdit: (job: any) => void, refreshJobs: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [deletingJobs, setDeletingJobs] = useState<DeletedJobState>({});
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exporting, setExporting] = useState(false);

  const queryClient = useQueryClient();

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportJobs(exportFormat);
      const dateStr = new Date().toISOString().split("T")[0];
      downloadBlob(blob, `saved-jobs-${dateStr}.${exportFormat}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete application");
      }
      return id;
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.jobs });
      
      const previousJobs = queryClient.getQueryData<Job[]>(queryKeys.jobs);
      
      if (previousJobs) {
        queryClient.setQueryData<Job[]>(queryKeys.jobs, (old) => 
          old ? old.filter(job => job.id !== id) : []
        );
      }
      
      setDeletingJobs(prev => ({ ...prev, [id]: "deleting" }));
      
      return { previousJobs };
    },
    onError: (err: Error, id: number, context: any) => {
      if (context?.previousJobs) {
        queryClient.setQueryData<Job[]>(queryKeys.jobs, context.previousJobs);
      }
      setDeletingJobs(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      alert(err.message || "Failed to delete application. Please try again.");
    },
    onSettled: (id: number) => {
      setDeletingJobs(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
    },
  });

  const availableYears = Array.from(new Set(jobs.map(job => format(parseISO(job.date_applied), "yyyy")))).sort((a, b) => b.localeCompare(a));
  const availableMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  const filteredJobs = jobs.filter(job => {
    if (deletingJobs[job.id] === "deleting") return false;
    
    const date = parseISO(job.date_applied);
    const year = format(date, "yyyy");
    const month = format(date, "MMMM");

    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || job.status === statusFilter;
    const matchesYear = yearFilter === "All" || year === yearFilter;
    const matchesMonth = monthFilter === "All" || month === monthFilter;

    return matchesSearch && matchesStatus && matchesYear && matchesMonth;
  });

  const groupedJobs = filteredJobs.reduce((acc: Record<string, Record<string, any[]>>, job) => {
    const date = parseISO(job.date_applied);
    const year = format(date, "yyyy");
    const month = format(date, "MMMM");
    
    if (!acc[year]) acc[year] = {};
    if (!acc[year][month]) acc[year][month] = [];
    
    acc[year][month].push(job);
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedJobs).sort((a, b) => b.localeCompare(a));

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)]">
        <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-full flex items-center justify-center">
          <FileText className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-semibold text-neutral-800 mb-2">No applications yet</h2>
        <p className="text-neutral-500 mb-6">Click "Add Job" to start tracking your applications.</p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openJobForm'))}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-indigo-500/20"
        >
          Add Your First Job
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-end">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">Applications</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Manage and track your job search progress</p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              <input 
                type="text" 
                placeholder="Search title or company..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>
            <div className="flex gap-2 items-center shrink-0">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                aria-label="Export format"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <InlineLoader size="sm" color="neutral" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export saved
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 p-4 bg-white/60 backdrop-blur-sm dark:bg-black/30 dark:border-gray-700/50 rounded-2xl border border-white/30">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mr-2">
            <Search className="w-3.5 h-3.5" />
            Filters
          </div>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-lg text-xs font-bold text-neutral-600 dark:text-neutral-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer hover:border-neutral-300 dark:hover:border-gray-600"
          >
            <option value="All">All Statuses</option>
            {Object.keys(STATUS_COLORS).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select 
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-lg text-xs font-bold text-neutral-600 dark:text-neutral-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer hover:border-neutral-300 dark:hover:border-gray-600"
          >
            <option value="All">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select 
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-lg text-xs font-bold text-neutral-600 dark:text-neutral-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer hover:border-neutral-300 dark:hover:border-gray-600"
          >
            <option value="All">All Months</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>

          {(statusFilter !== "All" || yearFilter !== "All" || monthFilter !== "All" || searchTerm !== "") && (
            <button 
              onClick={() => {
                setStatusFilter("All");
                setYearFilter("All");
                setMonthFilter("All");
                setSearchTerm("");
              }}
              className="ml-auto text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

        <div className="space-y-12">
        {sortedYears.map(year => (
          <div key={year} className="space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-black text-neutral-900 dark:text-neutral-200 tracking-tighter">{year}</h2>
              <div className="h-px flex-1 bg-neutral-200 dark:bg-gray-700" />
            </div>
            
            {Object.keys(groupedJobs[year])
              .sort((a, b) => {
                const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                return months.indexOf(b) - months.indexOf(a);
              })
              .map(month => (
                <div key={month} className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {month}
                    <span className="ml-2 px-2 py-0.5 bg-neutral-100 dark:bg-gray-800 text-neutral-500 dark:text-neutral-400 rounded-full text-[10px] lowercase tracking-normal">
                      {groupedJobs[year][month].length} applications
                    </span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedJobs[year][month].map(job => (
                      <div key={job.id} className="bg-white/60 backdrop-blur-sm dark:bg-gray-900/60 rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                        <div className="p-5 flex-1">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg text-neutral-900 dark:text-white leading-tight mb-1">{job.title}</h3>
                              <div className="flex items-center text-neutral-600 dark:text-neutral-300 text-sm font-medium">
                                <Building2 className="w-4 h-4 mr-1.5 text-neutral-400 dark:text-neutral-500" />
                                {job.company}
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/60 backdrop-blur-sm border ${STATUS_COLORS[job.status] || STATUS_COLORS["Saved"]}`}>
                              {job.status}
                            </span>
                          </div>

                          <div className="space-y-2 mt-4 text-sm text-neutral-600 dark:text-neutral-300">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-neutral-400 dark:text-neutral-500" />
                              Applied: {format(parseISO(job.date_applied), "MMM d, yyyy")}
                            </div>
                            
                            {job.work_model && (
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-neutral-400 dark:text-neutral-500" />
                                {job.work_model}
                              </div>
                            )}
                            
                            {job.salary_range && (
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-2 text-neutral-400 dark:text-neutral-500" />
                                {job.salary_range} <span className="text-[10px] ml-1 opacity-70 uppercase tracking-wider">/ {job.salary_frequency || 'Yearly'}</span>
                              </div>
                            )}
                          </div>

                          {job.tech_stack && job.tech_stack.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {job.tech_stack.slice(0, 4).map((tech: string) => (
                                <span key={tech} className="px-2 py-0.5 bg-white/60 dark:bg-gray-800 backdrop-blur-sm text-neutral-600 dark:text-neutral-300 rounded text-xs font-medium border border-white/30 dark:border-gray-700/50">
                                  {tech}
                                </span>
                              ))}
                              {job.tech_stack.length > 4 && (
                                <span className="px-2 py-0.5 bg-white/40 dark:bg-gray-800/50 backdrop-blur-sm text-neutral-500 dark:text-neutral-400 rounded text-xs font-medium">
                                  +{job.tech_stack.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="px-5 py-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border-t border-white/30 dark:border-gray-700/30 flex justify-between items-center">
                          <div className="flex gap-2 items-center">
                            <button 
                              onClick={() => onEdit(job)}
                              className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700/50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => handleDelete(e, job.id)}
                              disabled={deletingJobs[job.id] === "deleting"}
                              className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700/50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              {deletingJobs[job.id] === "deleting" ? (
                                <InlineLoader size="sm" color="danger" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                            
                            <div className="h-4 w-px bg-neutral-200 dark:bg-gray-700 mx-1" />
                            
                            {job.resume_url && (
                              <a href={job.resume_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700/50 rounded transition-colors" title="Resume">
                                <FileText className="w-4 h-4" />
                              </a>
                            )}
                            {job.cover_letter_url && (
                              <a href={job.cover_letter_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700/50 rounded transition-colors" title="Cover Letter">
                                <FileText className="w-4 h-4 opacity-70" />
                              </a>
                            )}
                            {job.screenshot_url && (
                              <a href={job.screenshot_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700/50 rounded transition-colors" title="Screenshot">
                                <ImageIcon className="w-4 h-4" />
                              </a>
                            )}

                            {job.attachments && job.attachments.length > 0 && (
                              <>
                                <div className="h-4 w-px bg-neutral-200 dark:bg-gray-700 mx-1" />
                                {job.attachments.map((file: any, idx: number) => (
                                  <a 
                                    key={idx} 
                                    href={file.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700/50 rounded transition-colors" 
                                    title={file.name}
                                  >
                                    <FileText className="w-4 h-4 text-indigo-400" />
                                  </a>
                                ))}
                              </>
                            )}
                          </div>
                          
                          {job.url && (
                            <a 
                              href={job.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                            >
                              View Post <ExternalLink className="w-3.5 h-3.5 ml-1" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ))}

        {filteredJobs.length === 0 && (
          <div className="text-center py-12 bg-white/60 backdrop-blur-sm dark:bg-black/30 dark:border-gray-700/50 rounded-2xl border border-white/30 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)]">
            <p className="text-neutral-500 dark:text-neutral-400">No applications match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
