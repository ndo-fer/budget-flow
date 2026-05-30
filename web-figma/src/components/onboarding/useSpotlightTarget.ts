import { useEffect, useState } from "react";

export interface TargetMeasurement {
  rect: DOMRect | null;
  element: Element | null;
  notFound: boolean;
}

function isElementVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
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

    // Helper to query element while verifying visibility
    const findTargetElement = () => {
      const el = document.querySelector(`[data-tour-id="${targetId}"]`);
      if (el && isElementVisible(el)) {
        return el;
      }
      if (fallbackId) {
        const fEl = document.querySelector(`[data-tour-id="${fallbackId}"]`);
        if (fEl && isElementVisible(fEl)) {
          return fEl;
        }
      }
      // Last resort fallback (even if invisible) so it doesn't break
      if (el) return el;
      if (fallbackId) {
        const fEl = document.querySelector(`[data-tour-id="${fallbackId}"]`);
        if (fEl) return fEl;
      }
      return null;
    };

    // Try finding immediately
    const currentEl = findTargetElement();

    if (currentEl) {
      return setupMeasurement(currentEl);
    }

    // Set up MutationObserver to find the element when it mounts
    let cleanUpListeners: (() => void) | null = null;
    
    const observer = new MutationObserver(() => {
      const foundEl = findTargetElement();

      if (foundEl) {
        cleanUpListeners = setupMeasurement(foundEl);
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Polling backup only to mark as not found if it fails to appear after 4 seconds
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      const finalEl = findTargetElement();
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
