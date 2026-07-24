"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type LessonShortcutOptions = {
  roadmapSlug: string;
  previousSlug?: string | null;
  nextSlug?: string | null;
  researchUrl?: string | null;
  canToggleComplete?: boolean;
  onToggleComplete: () => void;
  onToggleHelp: () => void;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

export function useLessonShortcuts({
  roadmapSlug,
  previousSlug,
  nextSlug,
  researchUrl,
  canToggleComplete = true,
  onToggleComplete,
  onToggleHelp,
}: LessonShortcutOptions) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault();
        onToggleHelp();
        return;
      }

      if (event.key === "Escape") {
        onToggleHelp();
        return;
      }

      if (
        event.key === "c" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        canToggleComplete
      ) {
        event.preventDefault();
        onToggleComplete();
        return;
      }

      if (
        event.key === "r" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        researchUrl
      ) {
        event.preventDefault();
        window.open(researchUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const goPrevious =
        event.key === "k" ||
        event.key === "p" ||
        (event.key === "ArrowLeft" && event.altKey);

      const goNext =
        event.key === "j" ||
        event.key === "n" ||
        (event.key === "ArrowRight" && event.altKey);

      if (goPrevious && previousSlug) {
        event.preventDefault();
        router.push(`/roadmaps/${roadmapSlug}/lessons/${previousSlug}`);
        return;
      }

      if (goNext && nextSlug) {
        event.preventDefault();
        router.push(`/roadmaps/${roadmapSlug}/lessons/${nextSlug}`);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canToggleComplete,
    nextSlug,
    onToggleComplete,
    onToggleHelp,
    previousSlug,
    researchUrl,
    roadmapSlug,
    router,
  ]);
}
