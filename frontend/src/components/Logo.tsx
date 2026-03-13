import { cn } from '@/lib/utils';

const sizeConfig = {
  xs: { icon: 'h-5 w-5', gap: 'gap-2', wordmark: 'text-sm font-semibold' },
  sm: { icon: 'h-7 w-7', gap: 'gap-2.5', wordmark: 'text-base font-semibold' },
  md: { icon: 'h-9 w-9', gap: 'gap-3', wordmark: 'text-lg font-semibold' },
  lg: { icon: 'h-10 w-10', gap: 'gap-3', wordmark: 'text-2xl font-bold' },
  xl: { icon: 'h-12 w-12', gap: 'gap-3.5', wordmark: 'text-3xl font-bold' },
} as const;

export type LogoSize = keyof typeof sizeConfig;

export interface LogoProps {
  size?: LogoSize;
  showWordmark?: boolean;
  href?: string;
  className?: string;
  wordmarkClassName?: string;
}

export default function Logo({
  size = 'sm',
  showWordmark = true,
  href = '#home',
  className,
  wordmarkClassName,
}: LogoProps) {
  const config = sizeConfig[size];

  return (
    <a
      href={href}
      className={cn('inline-flex items-center', config.gap, className)}
      aria-label="MERIDIAN home"
    >
      <img
        src="/logo.svg"
        alt={showWordmark ? '' : 'MERIDIAN'}
        aria-hidden={showWordmark}
        className={cn(config.icon, 'shrink-0 object-contain')}
        width={48}
        height={48}
        decoding="async"
      />
      {showWordmark && (
        <span
          className={cn('tracking-tight text-white', config.wordmark, wordmarkClassName)}
        >
          MERIDIAN
        </span>
      )}
    </a>
  );
}
