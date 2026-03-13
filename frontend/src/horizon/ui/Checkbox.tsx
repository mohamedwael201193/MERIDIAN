import type { InputHTMLAttributes } from 'react';

type CheckboxColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'teal'
  | 'navy'
  | 'lime'
  | 'cyan'
  | 'pink'
  | 'purple'
  | 'amber'
  | 'indigo'
  | 'gray'
  | 'brandScheme';

const colorClasses: Record<CheckboxColor, string> = {
  red: 'checked:border-none checked:bg-red-500 dark:checked:bg-red-400',
  blue: 'checked:border-none checked:bg-blue-500 dark:checked:bg-blue-400',
  green: 'checked:border-none checked:bg-green-500 dark:checked:bg-green-400',
  yellow: 'checked:border-none checked:bg-yellow-500 dark:checked:bg-yellow-400',
  orange: 'checked:border-none checked:bg-orange-500 dark:checked:bg-orange-400',
  teal: 'checked:border-none checked:bg-teal-500 dark:checked:bg-teal-400',
  navy: 'checked:border-none checked:bg-navy-500 dark:checked:bg-navy-400',
  lime: 'checked:border-none checked:bg-lime-500 dark:checked:bg-lime-400',
  cyan: 'checked:border-none checked:bg-cyan-500 dark:checked:bg-cyan-400',
  pink: 'checked:border-none checked:bg-pink-500 dark:checked:bg-pink-400',
  purple: 'checked:border-none checked:bg-purple-500 dark:checked:bg-purple-400',
  amber: 'checked:border-none checked:bg-amber-500 dark:checked:bg-amber-400',
  indigo: 'checked:border-none checked:bg-indigo-500 dark:checked:bg-indigo-400',
  gray: 'checked:border-none checked:bg-gray-500 dark:checked:bg-gray-400',
  brandScheme: 'checked:bg-brand-500 dark:checked:bg-brand-400',
};

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  color?: CheckboxColor;
  extra?: string;
}

export default function Checkbox({ color = 'brandScheme', extra = '', ...rest }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={`defaultCheckbox relative flex h-[20px] min-h-[20px] w-[20px] min-w-[20px] appearance-none items-center justify-center rounded-md border border-gray-300 text-white/0 outline-none transition duration-[0.2s] checked:border-none checked:text-white hover:cursor-pointer dark:border-white/10 ${colorClasses[color]} ${extra}`}
      {...rest}
    />
  );
}
