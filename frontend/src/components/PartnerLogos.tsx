import type { ReactNode } from 'react';

function LogoMark({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center text-white">
      {children}
    </span>
  );
}

export function CasperLogo() {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <LogoMark>
        <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden>
          <rect x="4" y="4" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M14 28V12l12 8-12 8z"
            fill="currentColor"
          />
        </svg>
      </LogoMark>
      <span className="whitespace-nowrap text-xl font-bold tracking-tight text-white">Casper</span>
    </div>
  );
}

export function OdraLogo() {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <LogoMark>
        <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden>
          <rect x="4" y="4" width="32" height="32" rx="6" stroke="currentColor" strokeWidth="2" />
          <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M20 14v12M14 20h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </LogoMark>
      <span className="whitespace-nowrap text-xl font-bold tracking-tight text-white">Odra</span>
    </div>
  );
}

export function CsprCloudLogo() {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <LogoMark>
        <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden>
          <rect x="4" y="4" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M14 24c0-3.3 2.7-6 6-6 .8 0 1.5.2 2.2.5 1-2.2 3.2-3.5 5.8-3.5 3.5 0 6.3 2.8 6.3 6.3 0 .3 0 .5-.1.8 2.1.5 3.8 2.3 3.8 4.6 0 2.6-2.1 4.7-4.7 4.7H14v-7.4z"
            fill="currentColor"
          />
        </svg>
      </LogoMark>
      <span className="whitespace-nowrap text-xl font-bold tracking-tight text-white">CSPR.cloud</span>
    </div>
  );
}

export function Erc3643Logo() {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <LogoMark>
        <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden>
          <path
            d="M20 4L34 12v16L20 36 6 28V12L20 4z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M16 20l3 3 6-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </LogoMark>
      <span className="whitespace-nowrap text-xl font-bold tracking-tight text-white">ERC-3643</span>
    </div>
  );
}

export function OpenAiLogo() {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <LogoMark>
        <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden>
          <rect x="4" y="4" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M20 11c4.5 0 7 2.5 7 6.5 0 4-2.5 6.5-7 6.5s-7-2.5-7-6.5c0-4 2.5-6.5 7-6.5z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="20" cy="28" r="3" fill="currentColor" />
        </svg>
      </LogoMark>
      <span className="whitespace-nowrap text-xl font-bold tracking-tight text-white">OpenAI</span>
    </div>
  );
}

export function X402Logo() {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <LogoMark>
        <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden>
          <path
            d="M20 3L35 11.5v17L20 37 5 28.5v-17L20 3z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M15 15l10 10M25 15l-10 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </LogoMark>
      <span className="whitespace-nowrap text-xl font-bold tracking-tight text-white">x402</span>
    </div>
  );
}

export const partnerLogos = [
  CasperLogo,
  OdraLogo,
  CsprCloudLogo,
  Erc3643Logo,
  OpenAiLogo,
  X402Logo,
];
