"use client";

import React, { useEffect, useRef, useCallback, memo } from "react";
import { useToaster, ToastBar, resolveValue, toast, type Toast } from "react-hot-toast";

interface ToastItemProps {
  toast: Toast;
  offset: number;
  onHeightUpdate: (id: string, height: number) => void;
}

const ToastItem = memo(function ToastItem({
  toast: t,
  offset,
  onHeightUpdate,
}: ToastItemProps) {
  const lastHeightRef = useRef<number>(t.height || 0);
  const top = (t.position || "top-center").includes("top");

  // Stable ref callback: will not re-execute on every parent render
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;

      const measureAndReport = () => {
        const height = el.getBoundingClientRect().height;
        // Strictly guard against dispatching if height has not meaningfully changed (>1px)
        if (height > 0 && Math.abs(height - lastHeightRef.current) > 1) {
          lastHeightRef.current = height;
          // Defer update to next animation frame to prevent synchronous state update cycles during render
          requestAnimationFrame(() => {
            onHeightUpdate(t.id, height);
          });
        }
      };

      measureAndReport();

      const observer = new MutationObserver(measureAndReport);
      observer.observe(el, {
        subtree: true,
        childList: true,
        characterData: true,
      });

      return () => {
        observer.disconnect();
      };
    },
    [t.id, onHeightUpdate]
  );

  return (
    <div
      ref={setRef}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: top ? 0 : undefined,
        bottom: !top ? 0 : undefined,
        display: "flex",
        justifyContent: "center",
        transition: "all 230ms cubic-bezier(.21,1.02,.73,1)",
        transform: `translateY(${offset * (top ? 1 : -1)}px)`,
        pointerEvents: t.visible ? "auto" : "none",
        cursor: "pointer",
      }}
      onClick={(e) => {
        // Don't auto-dismiss if user clicked an interactive control inside a custom toast
        const target = e.target as HTMLElement | null;
        if (target?.closest("button, a, input, select, textarea")) {
          return;
        }
        toast.dismiss(t.id);
      }}
      role="status"
      aria-live="polite"
    >
      {t.type === "custom" ? (
        resolveValue(t.message, t)
      ) : (
        <ToastBar toast={t} position={t.position || "top-center"}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
            </>
          )}
        </ToastBar>
      )}
    </div>
  );
});

/**
 * AppToaster
 *
 * Custom toast renderer solving touch/mobile freezing issues in react-hot-toast:
 * 1. Default react-hot-toast pauses on hover using mouseenter. On touch/mobile devices,
 *    tap triggers mouseenter, but mouseleave never fires, causing toasts to freeze forever.
 *    This component only pauses on devices with true mouse cursor (`(hover: hover)`).
 * 2. Auto-dismisses toasts reliably after 3.5 seconds (3-4 seconds).
 * 3. Tapping or clicking any toast dismisses it immediately.
 * 4. Resumes all timers on touch/pointer release.
 * 5. Uses memoized ToastItem with height caching to prevent React infinite update loop (Error #185).
 */
export default function AppToaster() {
  const { toasts, handlers } = useToaster({
    duration: 3500,
    success: {
      duration: 3500,
    },
    error: {
      duration: 4000,
    },
  });

  // Ensure timers resume when touch or pointer ends
  useEffect(() => {
    const resumeTimers = () => {
      handlers.endPause();
    };

    window.addEventListener("touchend", resumeTimers, { passive: true });
    window.addEventListener("touchcancel", resumeTimers, { passive: true });
    window.addEventListener("pointerup", resumeTimers, { passive: true });

    return () => {
      window.removeEventListener("touchend", resumeTimers);
      window.removeEventListener("touchcancel", resumeTimers);
      window.removeEventListener("pointerup", resumeTimers);
    };
  }, [handlers]);

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 99999,
        top: 16,
        left: 16,
        right: 16,
        bottom: 16,
        pointerEvents: "none",
      }}
      // Only pause on hover if device has true hover capability (desktop mouse)
      onMouseEnter={() => {
        if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
          handlers.startPause();
        }
      }}
      onMouseLeave={() => {
        handlers.endPause();
      }}
      onTouchStart={() => {
        // Prevent indefinite pausing on touch devices
      }}
      onTouchEnd={() => {
        handlers.endPause();
      }}
    >
      {toasts.map((t) => {
        const offset = handlers.calculateOffset(t, {
          reverseOrder: false,
          gutter: 8,
          defaultPosition: "top-center",
        });

        return (
          <ToastItem
            key={t.id}
            toast={t}
            offset={offset}
            onHeightUpdate={handlers.updateHeight}
          />
        );
      })}
    </div>
  );
}
