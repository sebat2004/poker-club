"use client";

import { useState } from "react";

export default function StopServerButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleStopServer() {
    const confirmed = window.confirm(
      "Are you sure you want to stop the Neko server?"
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/ec2/stop", {
        method: "POST",
      });

      const text = await response.text();

      let data: {
        ok?: boolean;
        message?: string;
        error?: string;
        details?: string;
      } = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(text || "Server returned invalid JSON");
      }

      if (!response.ok) {
        setMessage(data.error ?? "Failed to stop server");
        return;
      }

      setMessage(data.message ?? "Server stop request sent");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to stop server"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleStopServer}
        disabled={loading}
        className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Stopping..." : "Stop Server"}
      </button>

      {message && <p className="text-xs text-zinc-400">{message}</p>}
    </div>
  );
}