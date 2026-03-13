import { useEffect, useRef, useState, type ReactNode } from 'react';

function useOutsideAlerter(ref: React.RefObject<HTMLDivElement | null>, setOpen: (v: boolean) => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, setOpen]);
}

interface DropdownProps {
  button: ReactNode;
  children: ReactNode;
  classNames?: string;
  animation?: string;
}

export default function Dropdown({ button, children, classNames = '', animation }: DropdownProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useOutsideAlerter(wrapperRef, setOpen);

  return (
    <div ref={wrapperRef} className="relative flex">
      <div className="flex" onMouseDown={() => setOpen(!open)}>
        {button}
      </div>
      <div
        className={`${classNames} absolute z-10 ${
          animation ?? 'origin-top-right transition-all duration-300 ease-in-out'
        } ${open ? 'scale-100' : 'scale-0'}`}
      >
        {children}
      </div>
    </div>
  );
}
