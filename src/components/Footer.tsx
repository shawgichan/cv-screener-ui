import React from 'react';

export default function Footer() {
  const [isVisible, setIsVisible] = React.useState(false);
  const footerRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className={`w-full py-space-md bg-transparent mt-auto transition-opacity duration-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto px-gutter-desktop flex items-center justify-between text-on-surface-variant text-[11px] font-semibold">
        <div className="flex items-center gap-space-xs">
          <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
          <span className="text-[12px] font-medium text-on-surface">CV Screener</span>
          <span className="text-outline-variant">•</span>
          <span>Fast & confidential recruiter tool</span>
        </div>
        <div className="flex items-center gap-space-sm text-outline">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          <span>In-browser parsing • Third-party AI scoring</span>
        </div>
      </div>
    </footer>
  );
}
