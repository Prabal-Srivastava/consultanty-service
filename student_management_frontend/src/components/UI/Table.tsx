import React from 'react';

interface TableColumn<T> {
  key: string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (record: T) => void;
  striped?: boolean;
  hoverable?: boolean;
  caption?: string;
}

const Table = <T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  striped = true,
  hoverable = true,
  caption
}: TableProps<T>) => {
  const tableClasses = [
    'min-w-full divide-y divide-gray-200',
    striped ? 'bg-white' : '',
    hoverable ? 'hover:bg-gray-50' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="overflow-x-auto">
      <table className={tableClasses}>
        {caption && (
          <caption className="text-lg font-semibold text-left p-4">
            {caption}
          </caption>
        )}
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              >
                {columns.map((column, colIndex) => {
                  const cellValue = row[column.key];
                  const displayValue = column.render
                    ? column.render(cellValue, row)
                    : cellValue;
                  
                  return (
                    <td
                      key={colIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;