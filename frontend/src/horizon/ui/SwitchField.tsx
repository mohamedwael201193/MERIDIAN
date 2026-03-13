import Switch from './Switch';

interface SwitchFieldProps {
  id: string;
  label: string;
  desc?: string;
  mt?: string;
  mb?: string;
  defaultChecked?: boolean;
}

export default function SwitchField({ id, label, desc, mt = '', mb = '', defaultChecked }: SwitchFieldProps) {
  return (
    <div className={`flex items-center justify-between ${mt} ${mb}`}>
      <label htmlFor={id} className="max-w-[80%] hover:cursor-pointer lg:max-w-[65%]">
        <h5 className="text-base font-bold text-white">{label}</h5>
        {desc ? <p className="text-base text-gray-600">{desc}</p> : null}
      </label>
      <div>
        <Switch id={id} defaultChecked={defaultChecked} />
      </div>
    </div>
  );
}
