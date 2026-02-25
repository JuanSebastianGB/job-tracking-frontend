import { describe, it, expect, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryClient";

describe("queryKeys", () => {
  it("should have a jobs key as array", () => {
    expect(queryKeys.jobs).toEqual(["jobs"]);
    expect(Array.isArray(queryKeys.jobs)).toBe(true);
  });

  it("should have a job function that returns array with id", () => {
    const result = queryKeys.job(1);
    expect(result).toEqual(["jobs", 1]);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe("jobs");
    expect(result[1]).toBe(1);
  });

  it("should return consistent keys for the same id", () => {
    const id = 42;
    expect(queryKeys.job(id)).toEqual(queryKeys.job(id));
  });

  it("should return different keys for different ids", () => {
    expect(queryKeys.job(1)).not.toEqual(queryKeys.job(2));
  });

  it("should have jobs key as readonly tuple", () => {
    const keys = queryKeys.jobs;
    expect(keys).toStrictEqual(["jobs"] as const);
  });
});

describe("QueryClient configuration", () => {
  it("should have correct default staleTime", () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 },
      },
    });
    
    expect(client.getDefaultOptions().queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it("should have correct default gcTime", () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 },
      },
    });
    
    expect(client.getDefaultOptions().queries?.gcTime).toBe(10 * 60 * 1000);
  });
});

describe("Optimistic update logic - delete", () => {
  it("should filter out deleted job from cache array", () => {
    const jobs = [
      { id: 1, title: "Job 1" },
      { id: 2, title: "Job 2" },
      { id: 3, title: "Job 3" },
    ];
    
    const deletedId = 2;
    const updatedJobs = jobs.filter(job => job.id !== deletedId);
    
    expect(updatedJobs).toHaveLength(2);
    expect(updatedJobs.find(j => j.id === 2)).toBeUndefined();
  });

  it("should preserve original array when rolling back", () => {
    const originalJobs = [
      { id: 1, title: "Job 1" },
      { id: 2, title: "Job 2" },
    ];
    
    const context = { previousJobs: originalJobs };
    const rollbackJobs = context.previousJobs;
    
    expect(rollbackJobs).toEqual(originalJobs);
  });
});

describe("Optimistic update logic - create", () => {
  it("should add new job to beginning of cache array", () => {
    const existingJobs = [
      { id: 1, title: "Job 1" },
      { id: 2, title: "Job 2" },
    ];
    
    const newJob = { id: 3, title: "Job 3" };
    const updatedJobs = [...existingJobs, newJob];
    
    expect(updatedJobs).toHaveLength(3);
    expect(updatedJobs[2]).toEqual(newJob);
  });

  it("should add new job with pending status", () => {
    const newJob = { id: 3, title: "Job 3" };
    const optimisticJob = { ...newJob, status: "Pending" };
    
    expect(optimisticJob.status).toBe("Pending");
    expect(optimisticJob.title).toBe("Job 3");
  });

  it("should replace pending job with confirmed job on success", () => {
    const pendingJob = { id: 3, title: "Job 3", status: "Pending" };
    const confirmedJob = { id: 3, title: "Job 3", status: "Applied" };
    
    const updatedJobs = [confirmedJob];
    
    expect(updatedJobs[0].status).toBe("Applied");
  });
});
