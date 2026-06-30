import { Link } from 'react-router-dom'

export default function SidebarCard() {
  return (
    <div className="relative mt-14 flex w-[256px] justify-center rounded-[20px] bg-gradient-to-br from-brandLinear via-brand-500 to-brand-700 pb-4">
      <div className="absolute -top-12 flex h-24 w-24 items-center justify-center rounded-full border-[4px] border-white bg-gradient-to-b from-brandLinear to-brand-500 dark:!border-navy-800">
        <img src="/logo.svg" alt="MERIDIAN" className="h-10 w-10 brightness-0 invert" />
      </div>
      <div className="mt-16 flex h-fit flex-col items-center">
        <p className="text-lg font-bold text-white">MERIDIAN Protocol</p>
        <p className="mt-1 px-4 text-center text-sm text-white/90">
          Native staking yield, ERC-3643 compliance, and AI agent operations on Casper.
        </p>
        <Link
          to="/"
          className="text-medium mt-7 block rounded-full bg-gradient-to-b from-white/50 to-white/10 px-11 py-[12px] text-center text-base text-white hover:bg-gradient-to-b hover:from-white/40 hover:to-white/5"
        >
          Back to site
        </Link>
      </div>
    </div>
  )
}
