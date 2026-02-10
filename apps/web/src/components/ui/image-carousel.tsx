'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import Image from 'next/image';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface ImageCarouselProps {
  images: { src: string; alt?: string }[];
  aspectRatio?: string;
  className?: string;
}

export function ImageCarousel({ images, aspectRatio = '16/9', className }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const count = images.length;

  const goTo = useCallback((index: number) => {
    setCurrent((index + count) % count);
  }, [count]);

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    // Only attach if focusable wrapper is focused — see tabIndex below
    return () => document.removeEventListener('keydown', handleKey);
  }, [prev, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStart.current === null || touchEnd.current === null) return;
    const diff = touchStart.current - touchEnd.current;
    const threshold = 50;
    if (diff > threshold) next();
    if (diff < -threshold) prev();
  };

  if (count === 0) return null;

  return (
    <div
      className={clsx('relative overflow-hidden rounded-lg group', className)}
      style={{ aspectRatio }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      }}
      tabIndex={0}
      role="region"
      aria-label="Image carousel"
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-300 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((img, i) => (
          <div key={i} className="w-full shrink-0 relative h-full">
            <Image
              src={img.src}
              alt={img.alt ?? `Slide ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ))}
      </div>

      {/* Prev / Next Arrows */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow"
            aria-label="Previous"
          >
            <FiChevronLeft />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow"
            aria-label="Next"
          >
            <FiChevronRight />
          </button>
        </>
      )}

      {/* Dots + Counter */}
      {count > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={clsx(
                'w-2 h-2 rounded-full transition-colors',
                i === current ? 'bg-white' : 'bg-white/50',
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
          <span className="ml-2 text-xs text-white bg-black/40 px-2 py-0.5 rounded-full">
            {current + 1}/{count}
          </span>
        </div>
      )}
    </div>
  );
}
