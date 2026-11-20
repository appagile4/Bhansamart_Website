"use client";

import React, { useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

/** Six separate digit boxes, matching the app's vendor OTP screen (otpBox / otpBoxFilled styles). */
export default function OtpInput({ value, onChange, length = 6, disabled }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, length));
  };

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (!clean) return setDigit(index, "");
    if (clean.length > 1) {
      // typed/pasted several digits into one box — spread them forward
      const next = digits.slice();
      clean.split("").forEach((d, k) => {
        if (index + k < length) next[index + k] = d;
      });
      onChange(next.join(""));
      focus(index + clean.length);
      return;
    }
    setDigit(index, clean);
    focus(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      setDigit(index - 1, "");
      focus(index - 1);
    } else if (e.key === "ArrowLeft") {
      focus(index - 1);
    } else if (e.key === "ArrowRight") {
      focus(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    focus(pasted.length);
  };

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="One-time code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`w-11 h-12 sm:w-12 rounded-lg text-center text-lg font-bold text-vendor-dark border-[1.5px] focus:outline-none focus:ring-2 focus:ring-vendor-100 transition-colors ${
            d ? "border-vendor-dark bg-white" : "border-slate-300 bg-[#F8FAFC]"
          }`}
        />
      ))}
    </div>
  );
}
