'use client';

import { useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import clsx from 'clsx';
import { FiDownload } from 'react-icons/fi';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  showDownload?: boolean;
  className?: string;
}

export function QRCodeDisplay({ value, size = 180, showDownload = true, className }: QRCodeDisplayProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    if (!wrapperRef.current) return;
    const svg = wrapperRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'qr-code.png';
      link.href = pngUrl;
      link.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  }, [size]);

  return (
    <div className={clsx('inline-flex flex-col items-center gap-3', className)}>
      <div
        ref={wrapperRef}
        className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
      >
        <QRCodeSVG value={value} size={size} level="M" />
      </div>

      {showDownload && (
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <FiDownload className="text-base" />
          Download QR
        </button>
      )}
    </div>
  );
}
