"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AlignToolbar } from "@/components/editor/AlignToolbar";
import { LayersPanel } from "@/components/editor/LayersPanel";
import { RightPanel } from "@/components/editor/RightPanel";
import { ShortcutsModal } from "@/components/editor/ShortcutsModal";
import { ToolRail } from "@/components/editor/ToolRail";
import { TopBar } from "@/components/editor/TopBar";
import { ZoomBar } from "@/components/editor/ZoomBar";
import { Button } from "@/components/ui/Button";
import { FullPageLoader } from "@/components/ui/Spinner";
import { useEditorKeyboard } from "@/hooks/useEditorKeyboard";
import { useRoomEvents } from "@/hooks/useRoomEvents";
import { fitToScreen } from "@/lib/viewport";
import { useAuth } from "@/store/auth";
import { useEditor } from "@/store/editor";
import { cn } from "@/lib/utils";

const Canvas = dynamic(() => import("@/components/editor/Canvas").then((m) => m.Canvas), {
  ssr: false,
});

const PresentOverlay = dynamic(
  () => import("@/components/editor/PresentOverlay").then((m) => m.PresentOverlay),
  { ssr: false },
);

let editorLoadToken = 0;

function EditorRoom({ roomId }: { roomId: string }) {
  const router = useRouter();
  const status = useEditor((s) => s.status);
  const error = useEditor((s) => s.error);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  useRoomEvents();
  useEditorKeyboard();

  useEffect(() => {
    const user = useAuth.getState().user;
    if (!user) return;
    const token = ++editorLoadToken;
    let cancelled = false;
    void useEditor.getState().load(roomId, user.id).then(() => {
      // a stale resolution must never tear down a newer load
      if (cancelled && token === editorLoadToken) void useEditor.getState().leave();
    });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    return () => {
      // leaving the page leaves the room exactly once; bumping the token
      // invalidates any in-flight load's deferred leave.
      editorLoadToken += 1;
      void useEditor.getState().leave();
    };
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    const frame = window.requestAnimationFrame(() => fitToScreen());
    return () => window.cancelAnimationFrame(frame);
  }, [status, roomId]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-6">
        <div className="w-full max-w-md rounded-xl border border-line bg-card p-8 text-center shadow-pop">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="size-6 text-danger" />
          </span>
          <h1 className="font-display text-lg font-extrabold text-ink-900">Could not open this room</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{error ?? "Something went wrong."}</p>
          <Button className="mt-6" icon={<ArrowLeft className="size-4" />} onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (status !== "ready") {
    return (
      <div className="min-h-screen bg-surface">
        <FullPageLoader label="Opening room…" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      <TopBar
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onToggleLeft={() => setLeftOpen((v) => !v)}
        onToggleRight={() => setRightOpen((v) => !v)}
      />

      <div className="relative flex min-h-0 flex-1">
        <div
          className={cn(
            "h-full",
            leftOpen
              ? "absolute inset-y-0 left-0 z-30 shadow-pop"
              : "hidden",
            "lg:static lg:z-auto lg:block",
          )}
        >
          <LayersPanel />
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <Canvas />
          <ToolRail />
          <ZoomBar />
          <AlignToolbar />
        </div>

        <div
          className={cn(
            "h-full",
            rightOpen
              ? "absolute inset-y-0 right-0 z-30 shadow-pop"
              : "hidden",
            "lg:static lg:z-auto lg:block",
          )}
        >
          <RightPanel />
        </div>
      </div>

      <ShortcutsModal />
      <PresentOverlay />
    </div>
  );
}

function MissingRoom() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md rounded-xl border border-line bg-card p-8 text-center shadow-pop">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50">
          <AlertTriangle className="size-6 text-brand-600" />
        </span>
        <h1 className="font-display text-lg font-extrabold text-ink-900">No room selected</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Open a room from your dashboard to start designing.
        </p>
        <Button className="mt-6" icon={<ArrowLeft className="size-4" />} onClick={() => router.push("/dashboard")}>
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}

function EditorGate() {
  const params = useSearchParams();
  const roomId = params.get("room") ?? "";

  if (!roomId) return <MissingRoom />;

  return (
    <RequireAuth>
      <EditorRoom roomId={roomId} />
    </RequireAuth>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface">
          <FullPageLoader label="Opening room…" />
        </div>
      }
    >
      <EditorGate />
    </Suspense>
  );
}
