import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import React, { SetStateAction, useState, useEffect } from "react";
import Pagination from "./Pagination";
import { FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";

interface NameField {
  name: string;
}

type Props<T extends NameField> = {
  data: T[];
  columns: ColumnDef<T, string>[];
  count: number;
  limit: number;
  offset: number;
  setOffset: React.Dispatch<SetStateAction<number>>;
  sortBy: string;
  setSortBy: React.Dispatch<SetStateAction<string>>;
  sortOrder: string;
  setSortOrder: React.Dispatch<SetStateAction<string>>;
  sortOptions: string[];
  hidePagination?: boolean;
};

const CustomTable = <T extends NameField>({
  data,
  columns,
  count,
  limit,
  offset,
  setOffset,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  sortOptions,
  hidePagination = false,
}: Props<T>) => {
  const [pageIndex, setPageIndex] = useState(Math.floor(offset / limit));

  useEffect(() => {
    setPageIndex(Math.floor(offset / limit));
  }, [offset, limit]);

  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(columnId);
      setSortOrder("asc");
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting: [{ id: sortBy, desc: sortOrder === "desc" }],
    },
  });

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="flex flex-col space-y-4">
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <div className="sm:max-h-[70vh] max-h-[60vh] overflow-y-scroll">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isSortable = sortOptions.some(
                      (option) => option === header.id
                    );
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          isSortable ? "cursor-pointer hover:bg-gray-100" : ""
                        }`}
                        onClick={() => isSortable && handleSort(header.id)}
                      >
                        <div className="flex items-center justify-start gap-2 font-bold py-[6px]">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {isSortable && sortBy === header.id && (
                            <span className="ml-2">
                              {sortOrder === "asc" ? (
                                <FaSortAmountUp className="h-3 w-3 text-blue-500" />
                              ) : (
                                <FaSortAmountDown className="h-3 w-3 text-blue-500" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="p-4 whitespace-nowrap text-[13px] text-gray-800"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-16 text-center text-sm text-gray-500"
                  >
                    No data to display
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!hidePagination && table.getRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{offset + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(offset + limit, count)}
            </span>{" "}
            of <span className="font-medium">{count}</span> results
          </div>
          <Pagination
            table={table}
            pageIndex={pageIndex}
            setPageIndex={(pageIndex) => {
              setPageIndex(pageIndex);
              setOffset(pageIndex * limit);
            }}
            totalPages={totalPages}
            limit={limit}
            setOffset={setOffset}
          />
        </div>
      )}
    </div>
  );
};

export default CustomTable;
