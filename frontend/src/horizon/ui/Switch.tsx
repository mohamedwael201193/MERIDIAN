import type { InputHTMLAttributes } from 'react'

type SwitchColor =
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

const colorClasses: Record<SwitchColor | 'default', string> = {
  red: 'checked:bg-red-500 dark:checked:bg-red-400',
  blue: 'checked:bg-blue-500 dark:checked:bg-blue-400',
  green: 'checked:bg-green-500 dark:checked:bg-green-400',
  yellow: 'checked:bg-yellow-500 dark:checked:bg-yellow-400',
  orange: 'checked:bg-orange-500 dark:checked:bg-orange-400',
  teal: 'checked:bg-teal-500 dark:checked:bg-teal-400',
  navy: 'checked:bg-navy-500 dark:checked:bg-navy-400',
  lime: 'checked:bg-lime-500 dark:checked:bg-lime-400',
  cyan: 'checked:bg-cyan-500 dark:checked:bg-cyan-400',
  pink: 'checked:bg-pink-500 dark:checked:bg-pink-400',
  purple: 'checked:bg-purple-500 dark:checked:bg-purple-400',
  amber: 'checked:bg-amber-500 dark:checked:bg-amber-400',
  indigo: 'checked:bg-indigo-500 dark:checked:bg-indigo-400',
  gray: 'checked:bg-gray-500 dark:checked:bg-gray-400',
  default: 'checked:bg-brand-500 dark:checked:bg-brand-400',
}

interface SwitchProps extends InputHTMLAttributes<HTMLInputElement> {
  color?: SwitchColor
  extra?: string
}

export default function Switch({ color, extra = '', ...rest }: SwitchProps) {
  const checkedColor = color ? colorClasses[color] : colorClasses.default

  return (
    <input
      type="checkbox"
      className={`relative h-5 w-10 appearance-none rounded-[20px] bg-[#1e1e2a] outline-none transition duration-[0.5s] before:absolute before:top-[50%] before:h-4 before:w-4 before:translate-x-[2px] before:translate-y-[-50%] before:rounded-[20px] before:bg-[#a3aed0] before:shadow-[0_2px_5px_rgba(0,_0,_0,_.2)] before:transition before:content-[""] checked:before:translate-x-[22px] checked:before:bg-white hover:cursor-pointer ${checkedColor} ${extra}`}
      {...rest}
    />
  )
}
