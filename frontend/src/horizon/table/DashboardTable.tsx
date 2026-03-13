import type { ReactNode } from 'react';
import Card from '@/horizon/ui/Card';
import CardMenu from '@/horizon/ui/CardMenu';

export interface TableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => ReactNode;
}

interface DashboardTableProps<T extends Record<string, unknown>> {
  title: string;
  data: T[];
  columns: TableColumn<T>[];
  maxRows?: number;
  action?: ReactNode;
}

export default function DashboardTable<T extends Record<string, unknown>>({
  title,
  data,
  columns,
  maxRows = 10,
  action,
}: DashboardTableProps<T>) {
  const rows = data.slice(0, maxRows);

  return (
    <Card extra="h-full w-full px-6 sm:overflow-auto">
      <header className="relative flex items-center justify-between pt-4">
        <div className="text-xl font-bold text-white">{title}</div>
        {action ?? <CardMenu />}
      </header>

      <div className="mt-8 overflow-x-scroll xl:overflow-x-hidden">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className="cursor-pointer border-b border-white/10 pr-4 pb-2 pt-4 text-start"
                >
                  <p className="text-sm font-bold text-gray-600">{col.header}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key} className={`min-w-[120px] py-3 pr-4 ${col.className ?? ''}`}>
                    {col.render ? (
                      col.render(row)
                    ) : (
                      <p className="text-sm font-bold text-white">{String(row[col.key] ?? '')}</p>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
