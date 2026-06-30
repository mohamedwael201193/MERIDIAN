import { Link, useLocation } from 'react-router-dom'
import { HiX } from 'react-icons/hi'
import Logo from '@/components/Logo'
import SidebarCard from '@/horizon/ui/SidebarCard'
import { dashboardRoutes } from '@/dashboard/routes'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <div
      className={`fixed !z-50 flex min-h-screen w-[313px] flex-col border-r border-white/[0.12] bg-[#161622] pb-10 text-white shadow-2xl shadow-black/50 transition-all duration-175 md:!z-50 lg:!z-50 xl:!z-0 ${
        open ? 'translate-x-0' : '-translate-x-96'
      }`}
    >
      <span
        className="absolute right-4 top-4 block cursor-pointer text-white xl:hidden"
        onClick={onClose}
      >
        <HiX />
      </span>

      <div className="mx-[56px] mt-[50px] flex items-center">
        <Logo
          size="md"
          href="/dashboard"
          showWordmark
          wordmarkClassName="font-poppins uppercase text-white"
        />
      </div>

      <div className="mb-7 mt-[58px] h-px bg-white/10" />

      <ul className="mb-auto pt-1">
        {dashboardRoutes.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            onClick={() => window.innerWidth < 1200 && onClose()}
          >
            <div className="relative mb-3 flex hover:cursor-pointer">
              <li className="my-[3px] flex cursor-pointer items-center px-8">
                <span
                  className={
                    isActive(route.path) ? 'font-bold text-brand-500' : 'font-medium text-gray-600'
                  }
                >
                  {route.icon}
                </span>
                <p
                  className={`ml-4 flex leading-1 ${
                    isActive(route.path) ? 'font-bold text-white' : 'font-medium text-gray-600'
                  }`}
                >
                  {route.name}
                </p>
              </li>
              {isActive(route.path) ? (
                <div className="absolute right-0 top-px h-9 w-1 rounded-lg bg-brand-500" />
              ) : null}
            </div>
          </Link>
        ))}
      </ul>

      <div className="flex justify-center">
        <SidebarCard />
      </div>
    </div>
  )
}
