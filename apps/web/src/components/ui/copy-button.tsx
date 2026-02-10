'use client';

import { useState, useCallback } from 'react';
import clsx from 'clsx';
import { FiCopy, FiCheck } from 'react-icons/fi';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        'inline-flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors duration-150',
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        className,
      )}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? <FiCheck className="text-base" /> : <FiCopy className="text-base" />}
      {label && <span>{copied ? 'Copied!' : label}</span>}
      {!label && copied && <span>Copied!</span>}
    </button>
  );
}
