"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (
    type: ToastType,
    message: string,
    title?: string,
    duration?: number
  ) => void;
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
  };
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      type: ToastType,
      message: string,
      title?: string,
      duration: number = 4000
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = {
        id,
        type,
        title:
          title ||
          (type === "success"
            ? "Success"
            : type === "error"
            ? "Error"
            : type === "warning"
            ? "Warning"
            : "Notice"),
        message,
        duration,
      };

      setToasts((prev) => [...prev.slice(-3), newToast]);
    },
    []
  );

  const toastMethods = {
    success: useCallback(
      (message: string, title?: string, duration?: number) =>
        showToast("success", message, title, duration),
      [showToast]
    ),
    error: useCallback(
      (message: string, title?: string, duration?: number) =>
        showToast("error", message, title, duration),
      [showToast]
    ),
    info: useCallback(
      (message: string, title?: string, duration?: number) =>
        showToast("info", message, title, duration),
      [showToast]
    ),
    warning: useCallback(
      (message: string, title?: string, duration?: number) =>
        showToast("warning", message, title, duration),
      [showToast]
    ),
  };

  return (
    <ToastContext.Provider
      value={{ showToast, toast: toastMethods, dismissToast }}
    >
      {children}
      <ToasterContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToasterContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[999999] flex flex-col gap-2.5 max-w-[92vw] sm:max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const { id, type, title, message, duration = 4000 } = toast;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const config = {
    success: {
      borderColor: "border-emerald-500/40",
      badgeBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/80",
      titleColor: "text-emerald-950",
      accentBar: "bg-emerald-500",
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    error: {
      borderColor: "border-rose-500/40",
      badgeBg: "bg-rose-50 text-rose-600 border border-rose-200/80",
      titleColor: "text-rose-950",
      accentBar: "bg-rose-500",
      icon: <AlertCircle className="w-5 h-5" />,
    },
    warning: {
      borderColor: "border-amber-500/40",
      badgeBg: "bg-amber-50 text-amber-600 border border-amber-200/80",
      titleColor: "text-amber-950",
      accentBar: "bg-amber-500",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    info: {
      borderColor: "border-sky-500/40",
      badgeBg: "bg-sky-50 text-sky-600 border border-sky-200/80",
      titleColor: "text-sky-950",
      accentBar: "bg-sky-500",
      icon: <Info className="w-5 h-5" />,
    },
  }[type];

  return (
    <div
      role="alert"
      className={`pointer-events-auto relative overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.14)] border ${config.borderColor} p-4 flex items-start gap-3.5 transition-all duration-300 animate-in fade-in slide-in-from-top-3 sm:slide-in-from-right-4`}
    >
      {/* Colored Left Accent Strip */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1.5 ${config.accentBar}`}
      />

      {/* Icon Badge */}
      <div
        className={`w-9 h-9 rounded-xl ${config.badgeBg} flex items-center justify-center shrink-0 shadow-2xs`}
      >
        {config.icon}
      </div>

      {/* Text Body */}
      <div className="flex-1 min-w-0 pr-2">
        {title && (
          <h4 className={`text-xs sm:text-sm font-black ${config.titleColor} tracking-tight leading-snug`}>
            {title}
          </h4>
        )}
        <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5 leading-relaxed break-words">
          {message}
        </p>
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0 mt-0.5"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
