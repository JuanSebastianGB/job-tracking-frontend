/**
 * Export saved jobs as CSV or JSON and trigger a file download.
 */
export type ExportFormat = "csv" | "json";

export async function exportJobs(format: ExportFormat): Promise<Blob> {
  const res = await fetch(`/api/jobs/export?format=${format}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Export failed");
  }
  return res.blob();
}

/**
 * Download a blob with a given filename using a temporary object URL.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
