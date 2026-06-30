export default function Footer() {
  return (
    <div className="flex w-full flex-col items-center justify-between px-1 pb-8 pt-3 lg:px-8 xl:flex-row">
      <p className="mb-4 text-center text-sm text-gray-600 sm:!mb-0 md:text-base">
        © {new Date().getFullYear()} MERIDIAN · Casper Testnet · Autonomous compliant yield for
        RWAs
      </p>
      <ul className="flex flex-wrap items-center gap-3 sm:flex-nowrap md:gap-10">
        <li>
          <a href="/" className="text-base font-medium text-gray-600 hover:text-brand-500">
            Landing
          </a>
        </li>
        <li>
          <a href="/dashboard" className="text-base font-medium text-gray-600 hover:text-brand-500">
            Dashboard
          </a>
        </li>
        <li>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-base font-medium text-gray-600 hover:text-brand-500"
          >
            Docs
          </a>
        </li>
      </ul>
    </div>
  )
}
