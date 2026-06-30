import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'

export type LogoItem = {
  alt: string
  src?: string
  width?: number
  height?: number
  node?: ReactNode
}

type LogoCloudProps = ComponentProps<'div'> & {
  logos: LogoItem[]
  /** Animation duration in seconds — higher is slower. */
  duration?: number
  durationOnHover?: number
  variant?: 'light' | 'dark'
}

export function LogoCloud({
  logos,
  className,
  duration = 60,
  durationOnHover = 20,
  variant = 'dark',
  ...props
}: LogoCloudProps) {
  const isDark = variant === 'dark'

  return (
    <div
      className={cn(
        'relative mx-auto max-w-5xl py-6 md:border-x',
        isDark
          ? 'bg-gradient-to-r from-black via-transparent to-black md:border-white/10'
          : 'bg-gradient-to-r from-zinc-100 via-transparent to-zinc-100 md:border-zinc-200',
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -top-px left-1/2 w-screen -translate-x-1/2 border-t',
          isDark ? 'border-white/10' : 'border-zinc-200',
        )}
      />

      <InfiniteSlider gap={42} reverse duration={duration} durationOnHover={durationOnHover}>
        {logos.map((logo) =>
          logo.node ? (
            <div key={`logo-${logo.alt}`} className="flex shrink-0 items-center opacity-90">
              {logo.node}
            </div>
          ) : (
            <img
              alt={logo.alt}
              className={cn(
                'pointer-events-none h-4 select-none md:h-5',
                isDark && 'brightness-0 invert',
              )}
              height={logo.height ?? 'auto'}
              key={`logo-${logo.alt}`}
              loading="lazy"
              src={logo.src}
              width={logo.width ?? 'auto'}
            />
          ),
        )}
      </InfiniteSlider>

      <ProgressiveBlur
        blurIntensity={1}
        className="pointer-events-none absolute top-0 left-0 h-full w-[120px] sm:w-[160px]"
        direction="left"
        variant={variant}
      />
      <ProgressiveBlur
        blurIntensity={1}
        className="pointer-events-none absolute top-0 right-0 h-full w-[120px] sm:w-[160px]"
        direction="right"
        variant={variant}
      />

      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -bottom-px left-1/2 w-screen -translate-x-1/2 border-b',
          isDark ? 'border-white/10' : 'border-zinc-200',
        )}
      />
    </div>
  )
}
