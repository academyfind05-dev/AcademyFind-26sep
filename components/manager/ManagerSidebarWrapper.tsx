"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Menu, X, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ManagerSidebarWrapper({ children, title = "Manager Dashboard" }: { children: React.ReactNode, title?: string }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const desktopScrollRef = useRef<HTMLElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [mobileCanScrollDown, setMobileCanScrollDown] = useState(false);

  // Check desktop scroll
  const checkDesktopScroll = useCallback(() => {
    const el = desktopScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const hasMoreBelow = scrollHeight - scrollTop - clientHeight > 16;
    const hasMoreAbove = scrollTop > 16;
    setCanScrollDown(hasMoreBelow);
    setCanScrollUp(hasMoreAbove);
  }, []);

  // Check mobile scroll
  const checkMobileScroll = useCallback(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setMobileCanScrollDown(scrollHeight - scrollTop - clientHeight > 16);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
      checkDesktopScroll();
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkDesktopScroll]);

  // Desktop scroll & resize listeners
  useEffect(() => {
    const el = desktopScrollRef.current;
    if (!el) return;

    checkDesktopScroll();
    el.addEventListener("scroll", checkDesktopScroll, { passive: true });

    const observer = new ResizeObserver(() => checkDesktopScroll());
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", checkDesktopScroll);
      observer.disconnect();
    };
  }, [isOpen, checkDesktopScroll]);

  // Mobile scroll & resize listeners
  useEffect(() => {
    if (!isMobileOpen) return;
    const el = mobileScrollRef.current;
    if (!el) return;

    checkMobileScroll();
    el.addEventListener("scroll", checkMobileScroll, { passive: true });

    const observer = new ResizeObserver(() => checkMobileScroll());
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", checkMobileScroll);
      observer.disconnect();
    };
  }, [isMobileOpen, checkMobileScroll]);

  const handleScrollDownDesktop = () => {
    if (desktopScrollRef.current) {
      desktopScrollRef.current.scrollBy({ top: 220, behavior: "smooth" });
    }
  };

  const handleScrollDownMobile = () => {
    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollBy({ top: 220, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between bg-white/60 backdrop-blur-xl p-4 sticky top-0 z-40 border-b border-white/40 shadow-sm">
        <span className="font-extrabold text-lg text-stone-800">{title}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(true)}
          className="rounded-full hover:bg-stone-100"
        >
          <Menu className="w-6 h-6 text-stone-700" />
        </Button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-[280px] max-w-[80vw] h-full bg-[#f9f6f0] shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-lg text-stone-800">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="rounded-full">
                <X className="w-5 h-5 text-stone-500" />
              </Button>
            </div>
            
            <div className="relative flex-1 min-h-0">
              <div 
                ref={mobileScrollRef}
                className="h-full overflow-y-auto pb-12 pr-2 space-y-6 manager-sidebar-scroll" 
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('a')) setIsMobileOpen(false);
                }}
              >
                {children}
              </div>

              {/* Mobile Scroll Hint Pill */}
              {mobileCanScrollDown && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#f9f6f0] via-[#f9f6f0]/80 to-transparent flex items-end justify-center pb-2 z-20">
                  <button
                    type="button"
                    onClick={handleScrollDownMobile}
                    className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-[11px] font-bold rounded-full shadow-lg shadow-amber-500/20 transition-all duration-300 animate-bounce cursor-pointer"
                  >
                    <span>More options</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Container */}
      <div className={`hidden lg:block shrink-0 transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] ${isOpen ? "w-64" : "w-0 opacity-0 mx-0 overflow-hidden"}`}>
        <div className="sticky top-8 relative h-[calc(100vh-4rem)]">
          <aside 
            ref={desktopScrollRef}
            className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] pt-6 pb-8 pl-6 pr-3 flex flex-col space-y-6 overflow-y-auto manager-sidebar-scroll"
          >
            {children}
          </aside>

          {/* Top subtle fade when scrolled down */}
          {canScrollUp && (
            <div className="pointer-events-none absolute top-0 left-0 right-2 h-10 bg-gradient-to-b from-white/90 via-white/40 to-transparent rounded-t-[2rem] z-20 transition-opacity duration-300" />
          )}

          {/* Bottom subtle fade & interactive "More options ↓" pill */}
          {canScrollDown && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-2 h-16 bg-gradient-to-t from-white via-white/85 to-transparent rounded-b-[2rem] z-20 flex items-end justify-center pb-2.5 transition-opacity duration-300">
              <button
                type="button"
                onClick={handleScrollDownDesktop}
                className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-[11px] font-bold rounded-full shadow-lg shadow-amber-500/30 backdrop-blur-md transition-all duration-300 animate-bounce hover:animate-none cursor-pointer group"
                title="Scroll down to view all manager options"
              >
                <span>More options</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
              </button>
            </div>
          )}
        
          {/* Collapse button */}
          <div className={`absolute z-30 transition-all duration-400 ${isOpen ? "right-5" : "opacity-0 pointer-events-none"} top-10`}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="rounded-full w-7 h-7 bg-white border border-stone-200 shadow-sm text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-all hover:scale-110"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expand button (Visible when closed on Desktop) */}
      {!isOpen && (
        <div className="hidden lg:block fixed left-4 top-1/2 -translate-y-1/2 z-30">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="rounded-full w-10 h-10 bg-white/90 backdrop-blur-md border border-stone-200 shadow-md text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all hover:scale-110"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </>
  );
}
