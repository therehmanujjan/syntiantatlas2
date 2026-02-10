'use client';

import clsx from 'clsx';
import { FaWhatsapp, FaFacebookF, FaXTwitter } from 'react-icons/fa6';
import { FiMail } from 'react-icons/fi';

interface SocialShareButtonsProps {
  url: string;
  title?: string;
  message?: string;
  className?: string;
}

export function SocialShareButtons({ url, title = '', message = '', className }: SocialShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedMessage = encodeURIComponent(message || title);

  const channels = [
    {
      label: 'WhatsApp',
      icon: <FaWhatsapp />,
      href: `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`,
      color: 'bg-[#25D366] hover:bg-[#1da851]',
    },
    {
      label: 'Facebook',
      icon: <FaFacebookF />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'bg-[#1877F2] hover:bg-[#0d65d9]',
    },
    {
      label: 'X',
      icon: <FaXTwitter />,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: 'bg-black hover:bg-gray-800',
    },
    {
      label: 'Email',
      icon: <FiMail />,
      href: `mailto:?subject=${encodedTitle}&body=${encodedMessage}%20${encodedUrl}`,
      color: 'bg-gray-600 hover:bg-gray-700',
    },
  ];

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {channels.map((ch) => (
        <a
          key={ch.label}
          href={ch.href}
          target={ch.label !== 'Email' ? '_blank' : undefined}
          rel="noopener noreferrer"
          title={`Share via ${ch.label}`}
          className={clsx(
            'inline-flex items-center justify-center w-9 h-9 rounded-full text-white text-base transition-colors',
            ch.color,
          )}
        >
          {ch.icon}
        </a>
      ))}
    </div>
  );
}
