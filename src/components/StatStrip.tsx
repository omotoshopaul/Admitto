import React, { useEffect, useState, useRef } from 'react';

export default function StatStrip() {
  const [count, setCount] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const target = 10000;
    const duration = 1500;
    const fps = 60;
    const totalFrames = (duration / 1000) * fps;
    const stepValue = target / totalFrames;
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      start += stepValue;
      if (frame >= totalFrames || start >= target) {
        setCount(target);
        clearInterval(counter);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / fps);

    return () => clearInterval(counter);
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="w-full bg-red-50/50 py-16 border-y border-red-50">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="text-5xl md:text-6xl font-bold text-gray-900 flex items-center justify-center">
          {count.toLocaleString()}
          <span className="text-brand-red ml-1">+</span>
        </div>
        <div className="text-gray-500 font-medium mt-3 tracking-wide uppercase text-sm">
          Verified
        </div>
      </div>
    </section>
  );
}
