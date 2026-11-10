"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

/** Uses the browser's built-in speech (no data leaves the device). Hidden if unsupported (PLAN A12). */
export function ReadAloud({ text }: { text: string }) {
  const supported = useSyncExternalStore(
    () => () => {},
    () => "speechSynthesis" in window,
    () => false,
  );
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);
  if (!supported) {
    return <p className="text-sm text-muted">Read aloud isn&apos;t available in this browser.</p>;
  }
  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };
  return (
    <Button type="button" variant="secondary" size="sm" onClick={toggle} aria-pressed={speaking}>
      {speaking ? "Stop reading" : "Read this section aloud"}
    </Button>
  );
}
