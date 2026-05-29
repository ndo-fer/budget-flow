import { useEffect, useState } from "react";

export interface TargetMeasurement {
  rect: DOMRect | null;
  element: Element | null;
  notFound: boolean;
}

export function useSpotlightTarget(
  targetId: string | null,
  fallbackId?: string | null,
  triggerKey?: any
): TargetMeasurement {
  const [measurement, setMeasurement] = useState<TargetMeasurement>({
    rect: null,
    element: null,
    notFound: false,
  });

  useEffect(() => {
    if (!targetId) {
      setMeasurement({ rect: null, element: null, notFound: false });
      return;
    }

    // Helper to measure element and set listeners
    const setupMeasurement = (el: Element) => {
      // Target found! Scroll it into view if needed
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });

      // Measure immediately
      setMeasurement({ rect: el.getBoundingClientRect(), element: el, notFound: false });

      // Re-measure after a short delay in case scroll animated the element
      const timeout = setTimeout(() => {
        setMeasurement({ rect: el.getBoundingClientRect(), element: el, notFound: false });
      }, 200);

      // Set up resize and scroll listeners
      const handleUpdate = () => {
        setMeasurement({ rect: el.getBoundingClientRect(), element: el, notFound: false });
      };

      window.addEventListener("resize", handleUpdate);
      window.addEventListener("scroll", handleUpdate, true);

      return () => {
        clearTimeout(timeout);
        window.removeEventListener("resize", handleUpdate);
        window.removeEventListener("scroll", handleUpdate, true);
      };
    };

    // Try finding immediately
    let currentEl = document.querySelector(`[data-tour-id="${targetId}"]`);
    if (!currentEl && fallbackId) {
      currentEl = document.querySelector(`[data-tour-id="${fallbackId}"]`);
    }

    if (currentEl) {
      return setupMeasurement(currentEl);
    }

    // Set up MutationObserver to find the element when it mounts
    let cleanUpListeners: (() => void) | null = null;
    
    const observer = new MutationObserver(() => {
      let foundEl = document.querySelector(`[data-tour-id="${targetId}"]`);
      if (!foundEl && fallbackId) {
        foundEl = document.querySelector(`[data-tour-id="${fallbackId}"]`);
      }

      if (foundEl) {
        cleanUpListeners = setupMeasurement(foundEl);
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Polling backup only to mark as not found if it fails to appear after 4 seconds
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      let finalEl = document.querySelector(`[data-tour-id="${targetId}"]`);
      if (!finalEl && fallbackId) {
        finalEl = document.querySelector(`[data-tour-id="${fallbackId}"]`);
      }
      if (!finalEl) {
        setMeasurement({ rect: null, element: null, notFound: true });
      }
    }, 4000);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
      if (cleanUpListeners) {
        cleanUpListeners();
      }
    };
  }, [targetId, fallbackId, triggerKey]);

  return measurement;
}
