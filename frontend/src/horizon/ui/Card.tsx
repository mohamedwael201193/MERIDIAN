import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  extra?: string;
  children: ReactNode;
}

export default function Card({ extra = '', children, className, ...rest }: CardProps) {
  return (
    <div className={`horizon-panel relative z-[1] flex flex-col ${extra} ${className ?? ''}`} {...rest}>
      {children}
    </div>
  );
}
