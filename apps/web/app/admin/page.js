"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { timeAgo } from "@/lib/timeAgo";

const STATUS_TABS = [
  { key: "OPEN", label: "Open" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "DISMISSED", label: "Dismissed" },
];

export default function AdminPage() {
  const { token, profile, ready } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState("OPEN");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/admin/reports?status=${status}&size=50`, { token });
      setReports(data.content || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [token, status]);

  useEffect(() => {
    if (!ready) return;
    if (profile?.role !== "ADMIN") {
      router.replace("/home");
      return;
    }
    load();
  }, [ready, profile, router, load]);

  async function handleDismiss(reportId) {
    setBusyId(reportId);
    try {
      await apiFetch(`/admin/reports/${reportId}/dismiss`, { method: "POST", token });
      setReports((rs) => rs.filter((r) => r.id !== reportId));
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "Failed to dismiss report");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveContent(reportId) {
    if (!window.confirm("Remove this post/comment? This cannot be undone.")) return;
    setBusyId(reportId);
    try {
      await apiFetch(`/admin/reports/${reportId}/content`, { method: "DELETE", token });
      setReports((rs) => rs.filter((r) => r.id !== reportId));
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "Failed to remove content");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSuspend(report) {
    const reason = window.prompt(`Suspend ${report.targetAuthorAlias}? Enter a reason (optional):`);
    if (reason === null) return;
    setBusyId(report.id);
    try {
      await apiFetch(`/admin/users/${report.targetAuthorProfileId}/suspend`, {
        method: "POST",
        token,
        body: JSON.stringify({ reason: reason || null }),
      });
      window.alert(`${report.targetAuthorAlias} has been suspended.`);
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "Failed to suspend account");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready || profile?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-10">
      <h1 className="text-2xl font-semibold text-ink">Moderation queue</h1>
      <p className="mt-1 text-sm text-muted">
        User reports and AI-flagged posts that may not belong in the community.
      </p>

      <div className="mt-6 flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatus(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              status === tab.key ? "bg-accent text-on-accent" : "bg-surface text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {loading && <p className="text-sm text-muted">Loading…</p>}
        {error && <p className="text-sm text-accent">{error}</p>}
        {!loading && !error && reports.length === 0 && (
          <p className="text-sm text-muted">Nothing here.</p>
        )}

        {reports.map((report) => (
          <div key={report.id} className="rounded-xl border border-muted/20 bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span
                className={`rounded-full px-2 py-0.5 font-medium ${
                  report.source === "AI_FLAGGED" ? "bg-accent-muted text-ink" : "bg-base text-muted"
                }`}
              >
                {report.source === "AI_FLAGGED" ? "AI-flagged" : "User report"}
              </span>
              <span>{report.targetType}</span>
              <span>·</span>
              <span>{report.reasonCode}</span>
              {report.subforumSlug && (
                <>
                  <span>·</span>
                  <span>{report.subforumSlug}</span>
                </>
              )}
              <span>·</span>
              <span>{timeAgo(report.createdAt)}</span>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
              {report.targetExcerpt || "(content no longer exists)"}
            </p>

            <div className="mt-1 text-xs text-muted">
              By {report.targetAuthorAlias || "unknown"}
              {report.reporterAlias && <> · reported by {report.reporterAlias}</>}
            </div>

            {report.detail && (
              <p className="mt-2 rounded-lg bg-base px-3 py-2 text-xs text-muted">{report.detail}</p>
            )}

            {status === "OPEN" && (
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <button
                  disabled={busyId === report.id}
                  onClick={() => handleRemoveContent(report.id)}
                  className="rounded-full bg-accent px-4 py-1.5 font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
                >
                  Remove content
                </button>
                <button
                  disabled={busyId === report.id}
                  onClick={() => handleDismiss(report.id)}
                  className="rounded-full bg-base px-4 py-1.5 font-medium text-ink hover:opacity-90 disabled:opacity-60"
                >
                  Dismiss
                </button>
                {report.targetAuthorProfileId && (
                  <button
                    disabled={busyId === report.id}
                    onClick={() => handleSuspend(report)}
                    className="rounded-full bg-base px-4 py-1.5 font-medium text-ink hover:opacity-90 disabled:opacity-60"
                  >
                    Suspend author
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
