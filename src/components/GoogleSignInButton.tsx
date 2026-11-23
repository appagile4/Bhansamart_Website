"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { googleLogin } from "@/redux/slices/authSlice";

/* Minimal typings for Google Identity Services (https://accounts.google.com/gsi/client) */
type GsiCredentialResponse = { credential?: string };
type GsiButtonOptions = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
};
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (res: GsiCredentialResponse) => void;
            ux_mode?: "popup" | "redirect";
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: GsiButtonOptions) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

let gsiScriptPromise: Promise<void> | null = null;
function loadGsiScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiScriptPromise) {
    gsiScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gsiScriptPromise = null;
        reject(new Error("Failed to load Google Sign-In"));
      };
      document.head.appendChild(script);
    });
  }
  return gsiScriptPromise;
}

interface GoogleSignInButtonProps {
  /** "signin_with" → "Sign in with Google", "signup_with" → "Sign up with Google" */
  text?: "signin_with" | "signup_with" | "continue_with";
  referralCode?: string;
  disabled?: boolean;
}

/**
 * Official "Sign in with Google" button. On success it dispatches `googleLogin`, which calls
 * /api/auth/google → backend /auth/google and stores the BhansaMart token like a normal login.
 * Errors surface through the auth slice's `error`, which the login/register pages already show.
 */
export default function GoogleSignInButton({
  text = "signin_with",
  referralCode,
  disabled = false,
}: GoogleSignInButtonProps) {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const referralRef = useRef(referralCode);
  referralRef.current = referralCode;
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          ux_mode: "popup",
          cancel_on_tap_outside: true,
          callback: async (res) => {
            if (!res.credential) return;
            setSubmitting(true);
            await dispatch(
              googleLogin({ idToken: res.credential, referralCode: referralRef.current })
            );
            setSubmitting(false);
          },
        });
        const width = Math.min(400, Math.max(200, containerRef.current?.offsetWidth || 400));
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          logo_alignment: "center",
          text,
          width,
        });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));

    return () => {
      cancelled = true;
    };
  }, [dispatch, text]);

  if (!CLIENT_ID) {
    return (
      <p className="w-full text-center text-xs text-slate-400">
        Google Sign-In is not configured (missing NEXT_PUBLIC_GOOGLE_CLIENT_ID).
      </p>
    );
  }

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center gap-2">
      <div
        className={`relative w-full flex justify-center min-h-[44px] ${
          disabled || submitting ? "pointer-events-none opacity-60" : ""
        }`}
      >
        {status === "loading" && (
          <div className="absolute inset-0 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
        )}
        <div ref={buttonRef} />
      </div>
      {submitting && (
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          Signing in with Google...
        </p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-500">
          Couldn&apos;t load Google Sign-In. Check your connection and refresh.
        </p>
      )}
    </div>
  );
}
