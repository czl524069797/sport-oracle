"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin animated progress bar at the top of the page during navigation.
 * Triggers on route changes detected via pathname/searchParams.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startLoading = useCallback(() => {
    setLoading(true);
    setProgress(0);
  }, []);

  // When pathname or searchParams change, the navigation completed
  useEffect(() => {
    setLoading(false);
    setProgress(100);
    const timer = setTimeout(() => setProgress(0), 300);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Animate progress while loading
  useEffect(() => {
    if (!loading) return;

    setProgress(20);
    const t1 = setTimeout(() => setProgress(50), 150);
    const t2 = setTimeout(() => setProgress(70), 400);
    const t3 = setTimeout(() => setProgress(85), 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [loading]);

  // Listen for click on internal links to start the progress bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;

      // Only trigger for internal navigation that changes the route
      if (href !== pathname) {
        startLoading();
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, startLoading]);

  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5">
      <div
        className="h-full bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple transition-all ease-out shadow-[0_0_10px_rgba(0,240,255,0.5)]"
        style={{
          width: `${progress}%`,
          transitionDuration: loading ? "800ms" : "200ms",
        }}
      />
    </div>
  );
}
