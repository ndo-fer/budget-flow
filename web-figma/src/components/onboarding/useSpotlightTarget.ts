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

    let attempts = 0;
    const maxAttempts = 12; // Try for 1.8 seconds (12 * 150ms)
    const intervalTime = 150;

    const findAndMeasure = (): boolean => {
      let el = document.querySelector(`[data-tour-id="${targetId}"]`);
      if (!el && fallbackId) {
        el = document.querySelector(`[data-tour-id="${fallbackId}"]`);
      }

      if (el) {
        // Target found! Let's scroll it into view if needed
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });

        // Measure immediately
        const rect = el.getBoundingClientRect();
        setMeasurement({ rect, element: el, notFound: false });

        // Re-measure after a short delay in case scroll animated the element
        setTimeout(() => {
          if (el) {
            setMeasurement({ rect: el.getBoundingClientRect(), element: el, notFound: false });
          }
        }, 200);

        return true;
      }
      return false;
    };

    // Try finding immediately
    if (findAndMeasure()) {
      // Set up resize and scroll listeners
      const handleUpdate = () => {
        let el = document.querySelector(`[data-tour-id="${targetId}"]`);
        if (!el && fallbackId) {
          el = document.querySelector(`[data-tour-id="${fallbackId}"]`);
        }
        if (el) {
          setMeasurement({ rect: el.getBoundingClientRect(), element: el, notFound: false });
        }
      };

      window.addEventListener("resize", handleUpdate);
      window.addEventListener("scroll", handleUpdate, true);

      return () => {
        window.removeEventListener("resize", handleUpdate);
        window.removeEventListener("scroll", handleUpdate, true);
      };
    }

    // Polling retry
    const interval = setInterval(() => {
      attempts++;
      if (findAndMeasure()) {
        clearInterval(interval);
        
        const handleUpdate = () => {
          let el = document.querySelector(`[data-tour-id="${targetId}"]`);
          if (!el && fallbackId) {
            el = document.querySelector(`[data-tour-id="${fallbackId}"]`);
          }
          if (el) {
            setMeasurement({ rect: el.getBoundingClientRect(), element: el, notFound: false });
          }
        };
        window.addEventListener("resize", handleUpdate);
        window.addEventListener("scroll", handleUpdate, true);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setMeasurement({ rect: null, element: null, notFound: true });
      }
    }, intervalTime);

    return () => {
      clearInterval(interval);
    };
  }, [targetId, fallbackId, triggerKey]);

  return measurement;
}
