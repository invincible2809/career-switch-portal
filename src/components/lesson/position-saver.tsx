"use client";

import { useEffect } from "react";
import { savePositionAction } from "@/app/learn/[lesson]/actions";

/** Saves the learner's place whenever they open a section, so they can resume later. */
export function PositionSaver({ lessonId, sectionKey, versionId }: { lessonId: string; sectionKey: string; versionId: string }) {
  useEffect(() => {
    void savePositionAction(lessonId, sectionKey, versionId);
  }, [lessonId, sectionKey, versionId]);
  return null;
}
