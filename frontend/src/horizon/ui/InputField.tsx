interface InputFieldProps {
  label: string;
  id: string;
  extra?: string;
  type?: string;
  placeholder?: string;
  variant?: 'auth' | 'default';
  state?: 'error' | 'success';
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function InputField({
  label,
  id,
  extra = '',
  type = 'text',
  placeholder,
  variant,
  state,
  disabled,
  value,
  onChange,
}: InputFieldProps) {
  return (
    <div className={extra}>
      <label
        htmlFor={id}
        className={`text-sm text-white ${variant === 'auth' ? 'ml-1.5 font-medium' : 'ml-3 font-bold'}`}
      >
        {label}
      </label>
      <input
        disabled={disabled}
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-white/[0.12] bg-[#08080c] p-3 text-sm text-white outline-none ${
          disabled
            ? '!border-none !bg-navy-900 placeholder:!text-white/15'
            : state === 'error'
              ? 'border-red-500 text-red-400 placeholder:text-red-400'
              : state === 'success'
                ? 'border-green-500 text-green-400 placeholder:text-green-400'
                : 'border-white/10 placeholder:text-gray-600'
        }`}
      />
    </div>
  );
}
