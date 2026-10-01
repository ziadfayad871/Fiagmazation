"use client";

import { Suspense, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="h-16 border-b border-line bg-card" />}>
          <Topbar onMenu={() => setSidebarOpen(true)} />
        </Suspense>
        <main className="flex-1 overflow-y-auto panel-scroll">{children}</main>
      </div>
    </div>
  );
}
