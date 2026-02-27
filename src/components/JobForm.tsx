import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Sparkles, Loader2, UploadCloud, X, Plus, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseJobWithAI } from "../services/geminiService";
import { queryKeys } from "../lib/queryClient";
import { InlineLoader } from "./InlineLoader";

interface JobFormData {
  title: string;
  company: string;
  url: string;
  date_applied: string;
  status: string;
  work_model: string;
  salary_range: string;
  salary_frequency: string;
  tech_stack: string[];
  notes: string;
  screenshot_url: string;
  resume_url: string;
  cover_letter_url: string;
  attachments: Array<{ name: string; url: string }>;
}

export default function JobForm({ job, onSuccess, onCancel }: { job?: any, onSuccess: () => void, onCancel: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: job || {
      title: "",
      company: "",
      url: "",
      date_applied: new Date().toISOString().split("T")[0],
      status: "Applied",
      work_model: "Remote",
      salary_range: "",
      salary_frequency: "Yearly",
      tech_stack: [],
      notes: "",
      screenshot_url: "",
      resume_url: "",
      cover_letter_url: "",
      attachments: []
    }
  });

  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [showTextPaste, setShowTextPaste] = useState(false);
  const [rawText, setRawText] = useState("");
  const [techInput, setTechInput] = useState("");
  const techStack = watch("tech_stack") || [];
  const attachments = watch("attachments") || [];

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload file");
      }
      return res.json();
    },
    onError: (error: Error) => {
      alert(`Upload failed: ${error.message}. Please try again.`);
    },
  });

  const aiParseMutation = useMutation({
    mutationFn: async (input: { file?: File; text?: string }) => {
      if (input.file) {
        return parseJobWithAI({ file: input.file });
      }
      return parseJobWithAI({ text: input.text });
    },
    onError: (error: Error) => {
      alert(`AI parsing failed: ${error.message}. Please try again or fill in the details manually.`);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create application");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
      onSuccess();
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to create application. Please try again.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: JobFormData }) => {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update application");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
      onSuccess();
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to update application. Please try again.");
    },
  });

  const updateFormWithParsedData = (data: any) => {
    if (data.title) setValue("title", data.title);
    if (data.company) setValue("company", data.company);
    if (data.work_model) {
      // Normalize work model to match select options
      const model = data.work_model.charAt(0).toUpperCase() + data.work_model.slice(1).toLowerCase();
      if (["Remote", "Hybrid", "On-site"].includes(model)) {
        setValue("work_model", model);
      } else if (data.work_model.toLowerCase().includes("remote")) {
        setValue("work_model", "Remote");
      } else if (data.work_model.toLowerCase().includes("hybrid")) {
        setValue("work_model", "Hybrid");
      } else if (data.work_model.toLowerCase().includes("on-site") || data.work_model.toLowerCase().includes("onsite")) {
        setValue("work_model", "On-site");
      }
    }
    if (data.salary_range) setValue("salary_range", data.salary_range);
    if (data.salary_frequency) {
      const freq = data.salary_frequency.charAt(0).toUpperCase() + data.salary_frequency.slice(1).toLowerCase();
      if (["Hourly", "Monthly", "Yearly"].includes(freq)) {
        setValue("salary_frequency", freq);
      }
    }
    if (data.tech_stack) setValue("tech_stack", data.tech_stack);
    if (data.notes) setValue("notes", data.notes);
    if (data.screenshot_url) setValue("screenshot_url", data.screenshot_url);
    if (data.attachments) setValue("attachments", data.attachments);
  };

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      // Check for image paste
      const items = event.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              processScreenshot(file);
              return; // Stop if we found an image
            }
          }
        }
      }

      // Check for URL paste
      const pastedText = event.clipboardData?.getData("text");
      if (pastedText) {
        try {
          // Basic URL validation
          const url = new URL(pastedText.trim());
          if (url.protocol === "http:" || url.protocol === "https:") {
            setValue("url", pastedText.trim());
            return;
          }
        } catch (e) {
          // Not a URL, ignore
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const processScreenshot = async (file: File) => {
    setIsParsing(true);
    try {
      const data = await aiParseMutation.mutateAsync({ file });
      console.log("Pasted Screenshot Parsed Data:", data);
      updateFormWithParsedData(data);

      const uploadData = await uploadMutation.mutateAsync(file);
      if (uploadData.url) {
        setValue("screenshot_url", uploadData.url);
      }
    } catch (error: any) {
      // Error handled in mutation onError callbacks
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(field);
    try {
      const data = await uploadMutation.mutateAsync(file);
      if (data.url) {
        if (field === "attachments") {
          const current = watch("attachments") || [];
          setValue("attachments", [...current, { name: file.name, url: data.url }]);
        } else {
          setValue(field as any, data.url);
        }
      }
    } catch (error) {
      // Error handled in mutation onError callback
    } finally {
      setIsUploading(null);
    }
  };

  const removeAttachment = (index: number) => {
    const current = watch("attachments") || [];
    setValue("attachments", current.filter((_: any, i: number) => i !== index));
  };

  const handleParseAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const data = await aiParseMutation.mutateAsync({ file });
      console.log("Uploaded Screenshot Parsed Data:", data);
      updateFormWithParsedData(data);

      const uploadData = await uploadMutation.mutateAsync(file);
      if (uploadData.url) {
        setValue("screenshot_url", uploadData.url);
      }
    } catch (error: any) {
      // Error handled in mutation onError callback
    } finally {
      setIsParsing(false);
    }
  };

  const handleParseText = async () => {
    if (!rawText.trim()) return;
    
    setIsParsing(true);
    try {
      const data = await aiParseMutation.mutateAsync({ text: rawText });
      console.log("Text Parsed Data:", data);
      updateFormWithParsedData(data);
      
      setShowTextPaste(false);
      setRawText("");
    } catch (error: any) {
      // Error handled in mutation onError callback
    } finally {
      setIsParsing(false);
    }
  };

  const onSubmit = (data: JobFormData) => {
    if (job?.id) {
      updateMutation.mutate({ id: job.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const onError = () => {
    alert("Please fill in all required fields.");
  };

  const addTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      setValue("tech_stack", [...techStack, techInput.trim()]);
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => {
    setValue("tech_stack", techStack.filter((t: string) => t !== tech));
  };

  return (
    <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="p-6 border-b border-white/20 bg-white/40 backdrop-blur-sm flex justify-between items-center">
        <h2 className="text-xl font-semibold text-neutral-800">
          {job ? "Edit Application" : "New Application"}
        </h2>
        
        {!job && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setShowTextPaste(!showTextPaste)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium text-sm hover:bg-neutral-200 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Paste Text
              </button>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleParseAI}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isParsing}
                />
                <button 
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-sm hover:bg-indigo-100 transition-colors"
                >
                  {isParsing ? <InlineLoader size="sm" color="primary" /> : <Sparkles className="w-4 h-4" />}
                  Auto-fill from Screenshot
                </button>
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
              Tip: You can also press <kbd className="bg-neutral-200 px-1 rounded">Ctrl+V</kbd> to paste a screenshot
            </p>
          </div>
        )}
      </div>

      {showTextPaste && (
        <div className="p-6 bg-indigo-50/50 border-b border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-sm font-semibold text-indigo-900 mb-2">Paste Job Description</label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-sm"
            placeholder="Paste the job description text here..."
          />
          <div className="mt-3 flex justify-end gap-2">
            <button 
              type="button"
              onClick={() => setShowTextPaste(false)}
              className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleParseText}
              disabled={isParsing || !rawText.trim()}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isParsing ? <InlineLoader size="sm" color="primary" /> : <Sparkles className="w-4 h-4" />}
              Extract Details
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, onError)} className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Basic Information</h3>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Job Title *</label>
              <input 
                {...register("title", { required: "Job title is required" })} 
                className={`w-full px-3.5 py-2.5 bg-white/60 backdrop-blur-sm border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 shadow-sm ${errors.title ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-white/30'}`}
                placeholder="e.g. Senior Frontend Engineer"
              />
              {errors.title && <p className="mt-1 text-xs text-red-500 font-medium">{errors.title.message as string}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Company *</label>
              <input 
                {...register("company", { required: "Company name is required" })} 
                className={`w-full px-3.5 py-2.5 bg-white/60 backdrop-blur-sm border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 shadow-sm ${errors.company ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-white/30'}`}
                placeholder="e.g. Google"
              />
              {errors.company && <p className="mt-1 text-xs text-red-500 font-medium">{errors.company.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Job URL</label>
              <input 
                {...register("url")} 
                className="w-full px-3.5 py-2.5 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 shadow-sm"
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Status</label>
                <select 
                  {...register("status")} 
                  className="w-full px-3.5 py-2.5 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 shadow-sm cursor-pointer"
                >
                  <option value="Saved">Saved</option>
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interview</option>
                  <option value="Technical Test">Technical Test</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Date Applied</label>
                <input 
                  type="date"
                  {...register("date_applied")} 
                  className="w-full px-3.5 py-2.5 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Role Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Work Model</label>
                <select 
                  {...register("work_model")} 
                  className="w-full px-3.5 py-2.5 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 shadow-sm cursor-pointer"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Salary</label>
                <div className="flex gap-2">
                  <input 
                    {...register("salary_range")} 
                    className="flex-[2] min-w-[120px] px-3.5 py-2.5 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 shadow-sm"
                    placeholder="e.g. $120k"
                  />
                  <select
                    {...register("salary_frequency")}
                    className="flex-1 min-w-[80px] px-2 py-2.5 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 shadow-sm text-sm cursor-pointer"
                  >
                    <option value="Hourly">Hr</option>
                    <option value="Monthly">Mo</option>
                    <option value="Yearly">Yr</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Tech Stack</label>
              <div className="flex gap-2 mb-2">
                <input 
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }}
                  className="flex-1 px-3.5 py-2.5 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 shadow-sm"
                  placeholder="Add a skill..."
                />
                <button 
                  type="button" 
                  onClick={addTech}
                  className="px-4 py-2.5 bg-white/60 backdrop-blur-sm text-neutral-700 rounded-lg hover:bg-white/80 transition-all duration-200 shadow-sm border border-white/30"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {techStack.map((tech: string) => (
                  <span key={tech} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/60 backdrop-blur-sm text-indigo-700 text-xs font-semibold border border-white/30">
                    {tech}
                    <button type="button" onClick={() => removeTech(tech)} className="hover:text-indigo-900 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Notes</label>
              <textarea 
                {...register("notes")} 
                rows={3}
                className="w-full px-3.5 py-2.5 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 resize-none shadow-sm text-sm"
                placeholder="Mission, vision, why I applied..."
              />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/20">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6">Documents & Attachments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-tight">Resume (CV)</label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, "resume_url")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={!!isUploading}
                  />
                  <div className={`flex items-center justify-center gap-3 w-full px-4 py-4 border-2 border-dashed border-neutral-200 rounded-2xl group-hover:border-indigo-300 group-hover:bg-indigo-50/30 transition-all ${watch("resume_url") ? "bg-indigo-50/20 border-indigo-200" : "bg-white"}`}>
                    {isUploading === "resume_url" ? <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> : <UploadCloud className="w-5 h-5 text-neutral-400 group-hover:text-indigo-500" />}
                    <span className="text-sm font-medium text-neutral-600 group-hover:text-indigo-700">
                      {watch("resume_url") ? "Resume Uploaded" : "Upload Resume"}
                    </span>
                  </div>
                </div>
                {watch("resume_url") && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-lg border border-neutral-100">
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-[10px] text-neutral-500 truncate flex-1">{watch("resume_url")}</span>
                    <button type="button" onClick={() => setValue("resume_url", "")} className="text-neutral-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-tight">Cover Letter</label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, "cover_letter_url")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={!!isUploading}
                  />
                  <div className={`flex items-center justify-center gap-3 w-full px-4 py-4 border-2 border-dashed border-neutral-200 rounded-2xl group-hover:border-indigo-300 group-hover:bg-indigo-50/30 transition-all ${watch("cover_letter_url") ? "bg-indigo-50/20 border-indigo-200" : "bg-white"}`}>
                    {isUploading === "cover_letter_url" ? <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> : <UploadCloud className="w-5 h-5 text-neutral-400 group-hover:text-indigo-500" />}
                    <span className="text-sm font-medium text-neutral-600 group-hover:text-indigo-700">
                      {watch("cover_letter_url") ? "Cover Letter Uploaded" : "Upload Cover Letter"}
                    </span>
                  </div>
                </div>
                {watch("cover_letter_url") && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-lg border border-neutral-100">
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-[10px] text-neutral-500 truncate flex-1">{watch("cover_letter_url")}</span>
                    <button type="button" onClick={() => setValue("cover_letter_url", "")} className="text-neutral-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-tight">Other Attachments</label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs shadow-sm group">
                      <FileText className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="truncate max-w-[140px] font-medium text-neutral-700">{file.name}</span>
                      <button type="button" onClick={() => removeAttachment(index)} className="text-neutral-400 hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, "attachments")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={!!isUploading}
                  />
                  <div className="flex items-center justify-center gap-3 w-full px-4 py-8 border-2 border-dashed border-neutral-200 rounded-2xl group-hover:border-indigo-300 group-hover:bg-indigo-50/30 transition-all bg-neutral-50/50">
                    {isUploading === "attachments" ? <Loader2 className="w-6 h-6 animate-spin text-indigo-500" /> : <Plus className="w-6 h-6 text-neutral-400 group-hover:text-indigo-500" />}
                    <div className="text-left">
                      <p className="text-sm font-bold text-neutral-700 group-hover:text-indigo-700">Add Attachment</p>
                      <p className="text-[10px] text-neutral-400 font-medium">PDF, DOCX, Images, etc.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 flex justify-end gap-4">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-6 py-3 text-sm font-bold text-neutral-600 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white hover:border-white/50 transition-all duration-200 shadow-sm"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl hover:from-indigo-600 hover:to-purple-600 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 flex items-center gap-2 disabled:opacity-70 disabled:shadow-none"
          >
            {(createMutation.isPending || updateMutation.isPending) && <InlineLoader size="sm" color="primary" />}
            {job ? "Save Changes" : "Create Application"}
          </button>
        </div>
      </form>
    </div>
  );
}
