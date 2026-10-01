import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { HUB_URL } from "./api";
import { getAccessToken } from "./session";

export type HubEventName =
  | "PresenceJoined"
  | "PresenceLeft"
  | "CursorMoved"
  | "SelectionChanged"
  | "ElementCreated"
  | "ElementUpdated"
  | "ElementsDeleted"
  | "ElementsReordered"
  | "DesignSaved"
  | "CommentsChanged"
  | "RoomError"
  | "Rejoined";

type Handler = (payload: unknown) => void;

const listeners = new Map<HubEventName, Set<Handler>>();

export function onHub(event: HubEventName, handler: Handler): () => void {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  set.add(handler);
  return () => {
    set?.delete(handler);
  };
}

function emit(event: HubEventName, payload: unknown): void {
  listeners.get(event)?.forEach((handler) => handler(payload));
}

export interface JoinResult {
  roomId: string;
  you: { userId: string; displayName: string; color: string; connectionId: string };
  members: {
    userId: string;
    displayName: string;
    color: string;
    cursorX: number | null;
    cursorY: number | null;
    selection: string[];
  }[];
}

let connection: HubConnection | null = null;
let currentRoomId: string | null = null;
let startPromise: Promise<void> | null = null;

function ensureConnection(): HubConnection {
  if (connection) return connection;

  const conn = new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => getAccessToken() ?? "",
      withCredentials: true,
    })
    .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  const events: HubEventName[] = [
    "PresenceJoined",
    "PresenceLeft",
    "CursorMoved",
    "SelectionChanged",
    "ElementCreated",
    "ElementUpdated",
    "ElementsDeleted",
    "ElementsReordered",
    "DesignSaved",
    "CommentsChanged",
    "RoomError",
  ];
  for (const event of events) {
    conn.on(event, (payload: unknown) => emit(event, payload));
  }

  conn.onreconnected(async () => {
    if (currentRoomId) {
      try {
        const result = (await conn.invoke("JoinRoom", currentRoomId)) as JoinResult;
        emit("Rejoined", result);
      } catch {
        /* room will re-sync through REST if needed */
      }
    }
  });

  connection = conn;
  return conn;
}

async function ensureStarted(conn: HubConnection): Promise<void> {
  if (conn.state === HubConnectionState.Connected) return;
  if (!startPromise) {
    startPromise = conn
      .start()
      .then(() => undefined)
      .finally(() => {
        startPromise = null;
      });
  }
  await startPromise;
}

export async function joinRoom(roomId: string): Promise<JoinResult> {
  const conn = ensureConnection();
  const previousRoomId = currentRoomId;
  currentRoomId = roomId;
  await ensureStarted(conn);
  if (previousRoomId && previousRoomId !== roomId) {
    try {
      await conn.invoke("LeaveRoom", previousRoomId);
    } catch {
      /* leaving the previous room is best-effort */
    }
  }
  return (await conn.invoke("JoinRoom", roomId)) as JoinResult;
}

export async function leaveRoom(): Promise<void> {
  const conn = connection;
  const roomId = currentRoomId;
  currentRoomId = null;
  if (!conn || !roomId) return;
  try {
    if (conn.state === HubConnectionState.Connected) {
      await conn.invoke("LeaveRoom", roomId);
    }
  } catch {
    /* leaving is best-effort */
  }
  try {
    await conn.stop();
  } catch {
    /* ignore */
  }
}

export function notify(method: string, ...args: unknown[]): void {
  const conn = connection;
  if (!conn || conn.state !== HubConnectionState.Connected || !currentRoomId) return;
  conn.invoke(method, ...args).catch(() => {
    /* broadcasts are best-effort; REST already persisted the change */
  });
}

export function isSocketConnected(): boolean {
  return connection?.state === HubConnectionState.Connected;
}
