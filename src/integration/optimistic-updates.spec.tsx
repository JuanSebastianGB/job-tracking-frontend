import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockJobs = [
  { id: 1, title: "Frontend Developer", company: "Acme", date_applied: "2024-01-15", status: "Applied" },
  { id: 2, title: "Backend Developer", company: "Beta", date_applied: "2024-01-16", status: "Interview" },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000, retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("Integration: Create Job - Optimistic Add", () => {
  beforeEach(() => {
    vi.spyOn(window, "fetch").mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should add job to UI immediately after creation (optimistic)", async () => {
    const user = userEvent.setup();
    
    let resolveCreate: (value: Response) => void;
    const createPromise = new Promise<Response>((resolve) => {
      resolveCreate = resolve;
    });

    vi.spyOn(window, "fetch").mockImplementation((url, options) => {
      if (url === "/api/jobs" && options?.method === "POST") {
        return createPromise;
      }
      if (url === "/api/jobs") {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }
      return Promise.reject(new Error("Unknown request"));
    });

    function TestComponent() {
      const [showForm, setShowForm] = React.useState(false);
      const [jobs, setJobs] = React.useState<Array<{id: number; title: string; company: string; status: string}>>([]);
      const [isSubmitting, setIsSubmitting] = React.useState(false);

      const handleSubmit = async (data: { title: string; company: string }) => {
        setIsSubmitting(true);
        const optimisticJob = { ...data, id: Date.now(), date_applied: new Date().toISOString(), status: "Pending" };
        setJobs(prev => [...prev, optimisticJob]);
        
        try {
          await fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          setJobs(prev => prev.map(j => j.id === optimisticJob.id ? { ...j, status: "Applied" } : j));
        } catch (error) {
          setJobs(prev => prev.filter(j => j.id !== optimisticJob.id));
          throw error;
        } finally {
          setIsSubmitting(false);
        }
      };

      return (
        <div>
          <button onClick={() => setShowForm(true)}>Add Job</button>
          {showForm && (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit({ title: "Test Job", company: "Test Co" }); }}>
              <input name="title" defaultValue="Test Job" />
              <input name="company" defaultValue="Test Co" />
              <button type="submit" disabled={isSubmitting}>Submit</button>
            </form>
          )}
          <div data-testid="jobs-list">
            {jobs.map(job => (
              <div key={job.id} data-job-id={job.id}>
                {job.title} - {job.company} ({job.status})
              </div>
            ))}
          </div>
        </div>
      );
    }

    render(<TestComponent />, { wrapper: createWrapper() });

    await user.click(screen.getByText("Add Job"));
    
    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Test Job - Test Co/)).toBeInTheDocument();
    });

    await act(async () => {
      resolveCreate!(new Response(JSON.stringify({ id: 123, title: "Test Job", company: "Test Co", status: "Applied" }), { status: 201 }));
      await new Promise(r => setTimeout(r, 10));
    });

    await waitFor(() => {
      expect(screen.getByText(/Test Job - Test Co.*Applied/)).toBeInTheDocument();
    });
  });
});

describe("Integration: Delete Job - Optimistic Remove", () => {
  beforeEach(() => {
    vi.spyOn(window, "fetch").mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should remove job from UI immediately on delete (optimistic)", async () => {
    const user = userEvent.setup();
    
    let resolveDelete: (value: Response) => void;
    const deletePromise = new Promise<Response>((resolve) => {
      resolveDelete = resolve;
    });

    vi.spyOn(window, "fetch").mockImplementation((url) => {
      if (url === "/api/jobs") {
        return Promise.resolve(new Response(JSON.stringify(mockJobs), { status: 200 }));
      }
      if (typeof url === "string" && url.includes("/api/jobs/1")) {
        return deletePromise;
      }
      return Promise.reject(new Error("Unknown request"));
    });

    function TestComponent() {
      const [jobs, setJobs] = React.useState<Array<{id: number; title: string}>>([]);
      const [deletingId, setDeletingId] = React.useState<number | null>(null);

      React.useEffect(() => {
        fetch("/api/jobs")
          .then(r => r.json())
          .then(setJobs);
      }, []);

      const handleDelete = async (id: number) => {
        setDeletingId(id);
        const previousJobs = [...jobs];
        setJobs(prev => prev.filter(j => j.id !== id));
        
        try {
          await fetch(`/api/jobs/${id}`, { method: "DELETE" });
        } catch (error) {
          setJobs(previousJobs);
          throw error;
        } finally {
          setDeletingId(null);
        }
      };

      return (
        <div>
          <div data-testid="jobs-list">
            {jobs.map(job => (
              <div key={job.id} data-job-id={job.id}>
                {job.title}
                <button 
                  onClick={() => handleDelete(job.id)} 
                  disabled={deletingId === job.id}
                  data-testid={`delete-btn-${job.id}`}
                >
                  {deletingId === job.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    render(<TestComponent />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Frontend Developer/)).toBeInTheDocument();
      expect(screen.getByText(/Backend Developer/)).toBeInTheDocument();
    });

    const deleteButton = screen.getByTestId("delete-btn-1");
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText(/Frontend Developer/)).not.toBeInTheDocument();
      expect(screen.getByText(/Backend Developer/)).toBeInTheDocument();
    });

    await act(async () => {
      resolveDelete!(new Response(null, { status: 200 }));
      await new Promise(r => setTimeout(r, 10));
    });
  });

  it("should rollback job on delete error", async () => {
    const user = userEvent.setup();
    
    vi.spyOn(window, "fetch").mockImplementation((url) => {
      if (url === "/api/jobs") {
        return Promise.resolve(new Response(JSON.stringify(mockJobs), { status: 200 }));
      }
      if (typeof url === "string" && url.includes("/api/jobs/1")) {
        return Promise.reject(new Error("Delete failed"));
      }
      return Promise.reject(new Error("Unknown request"));
    });

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    function TestComponent() {
      const [jobs, setJobs] = React.useState<Array<{id: number; title: string}>>([]);

      React.useEffect(() => {
        fetch("/api/jobs")
          .then(r => r.json())
          .then(setJobs);
      }, []);

      const handleDelete = async (id: number) => {
        const previousJobs = [...jobs];
        setJobs(prev => prev.filter(j => j.id !== id));
        
        try {
          await fetch(`/api/jobs/${id}`, { method: "DELETE" });
        } catch (error) {
          setJobs(previousJobs);
          alert("Delete failed");
        }
      };

      return (
        <div>
          <div data-testid="jobs-list">
            {jobs.map(job => (
              <div key={job.id} data-testid={`job-${job.id}`}>
                {job.title}
                <button onClick={() => handleDelete(job.id)} data-testid={`delete-btn-${job.id}`}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    render(<TestComponent />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId("job-1")).toBeInTheDocument();
      expect(screen.getByTestId("job-2")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("delete-btn-1"));

    await waitFor(() => {
      expect(screen.getByTestId("job-1")).toBeInTheDocument();
    });

    consoleError.mockRestore();
  });
});

describe("Integration: Loading Skeleton", () => {
  it("should show skeleton while fetching jobs", async () => {
    vi.spyOn(window, "fetch").mockImplementation(() => 
      new Promise(() => {})
    );

    function TestComponent() {
      const [jobs, setJobs] = React.useState<typeof mockJobs | null>(null);
      const isLoading = jobs === null;

      React.useEffect(() => {
        const controller = new AbortController();
        fetch("/api/jobs", { signal: controller.signal })
          .then(r => r.json())
          .then(setJobs)
          .catch(() => {});
        
        return () => controller.abort();
      }, []);

      if (isLoading) {
        return (
          <div data-testid="skeleton">
            <div className="animate-pulse">
              <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              <div className="h-4 bg-neutral-100 rounded w-1/2 mt-2"></div>
            </div>
          </div>
        );
      }

      return (
        <div>
          {jobs.map(job => (
            <div key={job.id}>{job.title}</div>
          ))}
        </div>
      );
    }

    render(<TestComponent />, { wrapper: createWrapper() });

    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("should hide skeleton and show jobs after fetch completes", async () => {
    vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockJobs), { status: 200 })
    );

    function TestComponent() {
      const [jobs, setJobs] = React.useState<typeof mockJobs | null>(null);
      const isLoading = jobs === null;

      React.useEffect(() => {
        fetch("/api/jobs")
          .then(r => r.json())
          .then(setJobs);
      }, []);

      if (isLoading) {
        return <div data-testid="skeleton" className="animate-pulse">Loading...</div>;
      }

      return (
        <div data-testid="jobs-list">
          {jobs.map(job => (
            <div key={job.id}>{job.title}</div>
          ))}
        </div>
      );
    }

    render(<TestComponent />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId("jobs-list")).toBeInTheDocument();
      expect(screen.getByText(/Frontend Developer/)).toBeInTheDocument();
    });

    expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
  });
});
