import { cn } from '@/lib/utils';
import { LogoCloud } from '@/components/ui/logo-cloud-4';
import {
  CasperLogo,
  CsprCloudLogo,
  Erc3643Logo,
  OdraLogo,
  OpenAiLogo,
  X402Logo,
} from './PartnerLogos';

const ecosystemLogos = [
  { alt: 'Casper', node: <CasperLogo /> },
  { alt: 'Odra', node: <OdraLogo /> },
  { alt: 'CSPR.cloud', node: <CsprCloudLogo /> },
  { alt: 'ERC-3643', node: <Erc3643Logo /> },
  { alt: 'OpenAI', node: <OpenAiLogo /> },
  { alt: 'x402', node: <X402Logo /> },
];

export default function TrustedBy() {
  return (
    <section className="relative overflow-hidden bg-black py-12 md:py-16">
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 rounded-full',
          'bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.08),transparent_55%)]',
          'blur-[40px]',
        )}
      />

      <div className="relative mx-auto w-full max-w-6xl px-4">
        <h2 className="mb-8 text-center">
          <span className="block text-2xl font-medium text-zinc-500">Built on</span>
          <span className="text-2xl font-black tracking-tight text-white md:text-3xl">
            The <span className="text-red-500">Casper</span> Stack
          </span>
        </h2>

        <LogoCloud logos={ecosystemLogos} variant="dark" duration={50} durationOnHover={18} />
      </div>
    </section>
  );
}
