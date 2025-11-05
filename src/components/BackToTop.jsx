import { useEffect, useState, useRef } from "react";

export default function BackToTop({ threshold = 400 }) {
  const [visible, setVisible] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || document.documentElement.scrollTop;
        setVisible(y > threshold);
        ticking.current = false;
      });
    };
    onScroll(); // initialize state on mount
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const goTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="Back to top"
      title="Back to top"
      className={[
        "fixed z-40 bottom-6 right-6 md:bottom-8 md:right-8",
        "rounded-full bg-sky-600 text-white shadow-lg",
        "px-3 py-3 md:px-4 md:py-4",
        "transition-all duration-300 ease-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
      ].join(" ")}
    >
      {/* simple arrow icon */}
      <svg width="20" height="20" viewBox="0 0 24 24" role="img" aria-hidden="true">
        <path fill="currentColor" d="M12 5l7 7-1.4 1.4L13 9.8V20h-2V9.8L6.4 13.4 5 12z"/>
      </svg>
    </button>
  );
}
