import { io, Socket } from "socket.io-client";

/**
 * Vendor Socket.IO connection — same handshake as the app's socketService
 * (auth.token = vendor JWT; the server auto-joins store:{vendorId} / vendor:{vendorId}).
 *
 * Server origin comes from NEXT_PUBLIC_SOCKET_URL, or NEXT_PUBLIC_API_URL without its /api suffix.
 * The backend only accepts origins listed in its CLIENT_URL / allowedOrigins.
 */
export const getSocketUrl = (): string | null => {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const api = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!api) return null;
  return api.trim().replace(/\/+$/, "").replace(/\/api$/, "");
};

let socket: Socket | null = null;
let currentToken: string | null = null;

export function connectVendorSocket(token: string): Socket | null {
  const url = getSocketUrl();
  if (!url || !token) return null;
  if (socket && currentToken === token) return socket;

  socket?.disconnect();
  currentToken = token;
  socket = io(url, {
    auth: { token },
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 30000,
  });

  // (re)join the store room after every (re)connect — app: subscribeToVendorOrders
  socket.on("connect", () => {
    socket?.emit("vendor:orders:subscribe", {}, () => {});
  });

  return socket;
}

export function disconnectVendorSocket() {
  socket?.disconnect();
  socket = null;
  currentToken = null;
}

/** Vendor-facing server events (see Bhansamart_backend/src/socket/socketManager.js) */
export const VENDOR_EVENTS = {
  newOrder: "vendor:order:new",
  orderStatus: "vendor:order:status_updated",
  notification: "vendor:notification",
  notificationBroadcast: "vendor:notification:broadcast",
  cod: "vendor:cod:update",
  wallet: "vendor:wallet:update",
} as const;
