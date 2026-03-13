interface CarouselControlsProps {
  onPrev: () => void;
  onNext: () => void;
}

export default function CarouselControls({ onPrev, onNext }: CarouselControlsProps) {
  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous"
        className="flex h-10 w-10 items-center justify-center border border-white/15 text-zinc-400 transition hover:border-red-500/40 hover:text-white"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next"
        className="flex h-10 w-10 items-center justify-center border border-white/15 text-zinc-400 transition hover:border-red-500/40 hover:text-white"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
          <path
            d="M9 18L15 12L9 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
