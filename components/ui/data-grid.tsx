"use client";

import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type GetRowIdParams,
  type GridOptions,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { cn } from "@/lib/utils";

ModuleRegistry.registerModules([AllCommunityModule]);

// Matches the app's colour, radius and font.
export const gridTheme = themeQuartz.withParams({
  accentColor: "#881337",
  borderRadius: 5,
  wrapperBorderRadius: 8,
  fontFamily: "inherit",
  fontSize: 13,
  headerFontWeight: 500,
});

type DataGridProps<T> = {
  rows: T[];
  columns: ColDef<T>[];
  getRowId: (row: T) => string;
  /** Tailwind height class. Grids need a fixed height to scroll. */
  heightClass?: string;
  /** Rows per page. Pagination only shows when there are more rows than this. */
  pageSize?: number;
  quickFilter?: string;
  /** Extra rows pinned under the grid, such as totals. */
  pinnedBottom?: T[];
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  className?: string;
} & Pick<GridOptions<T>, "onCellValueChanged" | "rowSelection" | "onFirstDataRendered">;

/** AG Grid Community with the app's theme and sensible defaults. */
export function DataGrid<T>({
  rows,
  columns,
  getRowId,
  heightClass = "h-96",
  pageSize = 25,
  quickFilter,
  pinnedBottom,
  onRowClick,
  onRowDoubleClick,
  className,
  ...options
}: DataGridProps<T>) {
  const paginate = rows.length > pageSize;

  return (
    <div className={cn("w-full", heightClass, className)}>
      <AgGridReact<T>
        theme={gridTheme}
        rowData={rows}
        columnDefs={columns}
        defaultColDef={{ sortable: true, filter: true, resizable: true, minWidth: 90 }}
        getRowId={(params: GetRowIdParams<T>) => getRowId(params.data)}
        quickFilterText={quickFilter}
        pinnedBottomRowData={pinnedBottom}
        onRowClicked={(event) => {
          // Clicks on buttons or inputs inside a cell aren't row clicks.
          const target = event.event?.target as HTMLElement | null | undefined;
          if (target?.closest("button, a, input, textarea")) return;
          if (event.data && !event.rowPinned) onRowClick?.(event.data);
        }}
        onRowDoubleClicked={(event) => event.data && !event.rowPinned && onRowDoubleClick?.(event.data)}
        rowClass={onRowClick ? "cursor-pointer" : undefined}
        pagination={paginate}
        paginationPageSize={pageSize}
        paginationPageSizeSelector={paginate ? [pageSize, pageSize * 2, pageSize * 4] : false}
        {...options}
      />
    </div>
  );
}
