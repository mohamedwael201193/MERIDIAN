import { Link } from 'react-router-dom'
import { BsArrowBarUp } from 'react-icons/bs'
import { FiAlignJustify, FiSearch } from 'react-icons/fi'
import { IoMdNotificationsOutline, IoMdInformationCircleOutline } from 'react-icons/io'
import Dropdown from '@/horizon/ui/Dropdown'

interface DashboardNavbarProps {
  brandText: string
  onOpenSidenav: () => void
}

export default function DashboardNavbar({ brandText, onOpenSidenav }: DashboardNavbarProps) {
  return (
    <nav className="horizon-panel sticky top-4 z-40 !flex-row flex-wrap items-center justify-between !rounded-xl !p-2 backdrop-blur-xl">
      <div className="ml-[6px]">
        <div className="h-6 w-[224px] pt-1">
          <Link
            className="text-sm font-normal text-gray-600 hover:text-white hover:underline"
            to="/dashboard"
          >
            Pages
            <span className="mx-1 text-sm text-gray-600"> / </span>
          </Link>
          <span className="text-sm font-normal capitalize text-gray-600">{brandText}</span>
        </div>
        <p className="shrink text-[33px] capitalize text-white">
          <span className="font-bold capitalize">{brandText}</span>
        </p>
      </div>

      <div className="dashboard-toolbar relative mt-[3px] flex h-[61px] w-[355px] flex-grow items-center justify-around gap-2 px-2 py-2 md:w-[365px] md:flex-grow-0 md:gap-1 xl:w-[365px] xl:gap-2">
        <div className="flex h-full items-center rounded-full border border-white/[0.08] bg-[#08080c] text-white xl:w-[225px]">
          <p className="pl-3 pr-2 text-xl">
            <FiSearch className="h-4 w-4 text-gray-600" />
          </p>
          <input
            type="text"
            placeholder="Search..."
            className="dashboard-search block h-full w-full rounded-full border-0 bg-transparent text-sm font-medium outline-none ring-0 sm:w-fit"
          />
        </div>
        <span
          className="flex cursor-pointer text-xl text-gray-600 hover:text-white xl:hidden"
          onClick={onOpenSidenav}
        >
          <FiAlignJustify className="h-5 w-5" />
        </span>

        <Dropdown
          button={
            <p className="cursor-pointer">
              <IoMdNotificationsOutline className="h-4 w-4 text-gray-600 hover:text-white" />
            </p>
          }
          animation="origin-[65%_0%] md:origin-top-right transition-all duration-300 ease-in-out"
          classNames="py-2 top-4 -left-[230px] md:-left-[440px] w-max"
        >
          <div className="horizon-panel flex w-[360px] flex-col gap-3 !p-4 sm:w-[460px]">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-white">Notifications</p>
              <p className="text-sm font-bold text-brand-500">Mark all read</p>
            </div>
            <button type="button" className="flex w-full items-center">
              <div className="flex h-full w-[85px] items-center justify-center rounded-xl bg-gradient-to-b from-brandLinear to-brand-500 py-4 text-2xl text-white">
                <BsArrowBarUp />
              </div>
              <div className="ml-2 flex h-full w-full flex-col justify-center rounded-lg px-1 text-sm">
                <p className="mb-1 text-left text-base font-bold text-white">
                  Yield distributed — Era 1423
                </p>
                <p className="text-left text-xs text-gray-600">
                  12,740 CSPR rewards distributed to compliant holders
                </p>
              </div>
            </button>
            <button type="button" className="flex w-full items-center">
              <div className="flex h-full w-[85px] items-center justify-center rounded-xl bg-gradient-to-b from-brandLinear to-brand-500 py-4 text-2xl text-white">
                <BsArrowBarUp />
              </div>
              <div className="ml-2 flex h-full w-full flex-col justify-center rounded-lg px-1 text-sm">
                <p className="mb-1 text-left text-base font-bold text-white">
                  ComplianceAgent — holder revoked
                </p>
                <p className="text-left text-xs text-gray-600">
                  Holder 03c9…2e17 removed from registry
                </p>
              </div>
            </button>
          </div>
        </Dropdown>

        <Dropdown
          button={
            <p className="cursor-pointer">
              <IoMdInformationCircleOutline className="h-4 w-4 text-gray-600 hover:text-white" />
            </p>
          }
          classNames="py-2 top-6 -left-[250px] md:-left-[330px] w-max"
          animation="origin-[75%_0%] md:origin-top-right transition-all duration-300 ease-in-out"
        >
          <div className="horizon-panel flex w-[350px] flex-col gap-2 !p-4">
            <div className="mb-2 aspect-video w-full rounded-lg bg-gradient-to-br from-brand-900 via-navy-800 to-brand-700" />
            <Link
              to="/"
              className="flex cursor-pointer items-center justify-center rounded-xl bg-brand-500 py-[11px] font-bold text-white transition duration-200 hover:bg-brand-600"
            >
              View Landing Page
            </Link>
            <a
              href="https://docs.casper.network"
              target="_blank"
              rel="noreferrer"
              className="flex cursor-pointer items-center justify-center rounded-xl border border-white/10 py-[11px] font-bold text-white transition duration-200 hover:border-brand-500/30 hover:bg-brand-500/10"
            >
              Casper Documentation
            </a>
          </div>
        </Dropdown>

        <Dropdown
          button={
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
              OP
            </div>
          }
          classNames="py-2 top-8 -left-[180px] w-max"
        >
          <div className="horizon-panel flex w-56 flex-col justify-start !p-0">
            <div className="p-4">
              <p className="text-sm font-bold text-white">👋 Operator</p>
            </div>
            <div className="h-px w-full bg-white/10" />
            <div className="flex flex-col p-4">
              <span className="text-sm text-gray-600">API Key Settings</span>
              <span className="mt-3 text-sm text-gray-600">Indexer Status</span>
              <span className="mt-3 text-sm font-medium text-brand-500">Disconnect</span>
            </div>
          </div>
        </Dropdown>
      </div>
    </nav>
  )
}
