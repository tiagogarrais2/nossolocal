"use client";

import { SessionProvider } from "next-auth/react";
import { PathRecorder } from "@/components/PathRecorder";

export function Providers({ children }) {
  return (
    <SessionProvider>
      <PathRecorder />
      {children}
    </SessionProvider>
  );
}
