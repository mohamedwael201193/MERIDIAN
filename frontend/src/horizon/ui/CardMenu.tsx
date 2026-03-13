import { AiOutlineUser } from 'react-icons/ai';
import { BsThreeDots } from 'react-icons/bs';
import { FiSettings } from 'react-icons/fi';
import { TiLightbulb } from 'react-icons/ti';
import Dropdown from './Dropdown';

interface CardMenuProps {
  transparent?: boolean;
}

export default function CardMenu({ transparent }: CardMenuProps) {
  return (
    <Dropdown
      button={
        <button
          type="button"
          className={`flex items-center text-xl hover:cursor-pointer ${
            transparent
              ? 'bg-none text-white hover:bg-none active:bg-none'
              : 'linear justify-center rounded-lg bg-navy-700 p-2 font-bold text-brand-500 transition duration-200 hover:bg-white/10'
          }`}
        >
          <BsThreeDots className="h-6 w-6" />
        </button>
      }
      animation="origin-top-right transition-all duration-300 ease-in-out"
      classNames={`${transparent ? 'top-8' : 'top-11'} right-0 w-max`}
    >
      <div className="z-50 w-max rounded-xl border border-white/[0.06] bg-navy-700 px-4 py-3 text-sm shadow-xl shadow-black/40">
        <p className="flex cursor-pointer items-center gap-2 text-gray-600 hover:font-medium hover:text-white">
          <AiOutlineUser />
          Export CSV
        </p>
        <p className="mt-2 flex cursor-pointer items-center gap-2 pt-1 text-gray-600 hover:font-medium hover:text-white">
          <TiLightbulb />
          Refresh data
        </p>
        <p className="mt-2 flex cursor-pointer items-center gap-2 pt-1 text-gray-600 hover:font-medium hover:text-white">
          <FiSettings />
          Panel settings
        </p>
      </div>
    </Dropdown>
  );
}
