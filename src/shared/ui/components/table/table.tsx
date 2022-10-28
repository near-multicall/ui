import {
    TableContainer,
    TableHead,
    TableCell,
    TableRow as MuiTableRow,
    TableBody,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import clsx from "clsx";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";

import { TableRowCompact, TableRow, type TableRowProps, TableHeader } from "./row";
import "./table.scss";

export interface TableProps extends HTMLAttributes<HTMLDivElement>, Pick<TableRowProps, "dense"> {
    RowComponent?: typeof TableRow;
    RowCompactComponent?: typeof TableRowCompact;
    RowProps?: Omit<TableRowProps, "cells" | "dense" | "header" | "id" | "selectable">;
    /**
     * `"classic"` mode is a classic table view.
     *
     * In `"compact"` mode, the table is being rendered as a single column with `rows` rendered as cards,
     *  where every card is entitled by corresponding element from `header`.
     *
     * In `"default"` mode, the table is being rendered according to the screen size:
     *  `"classic"` mode is meant for wide screens, while `"compact"` is meant for medium and small ones.
     *
     * Whether `"compact"` or `"classic"` mode is selected, it's being applied regardless of the screen size.
     */
    displayMode?: "default" | "compact" | "classic";
    header: TableHeader;
    onRowsSelected?: ((selectedRowsIds: TableRowProps["id"][]) => void) | null;
    rows?: { id: TableRowProps["id"]; content: TableRowProps["cells"] }[] | null;
}

const _Table = "Table";

export const Table = ({
    RowComponent = TableRow,
    RowCompactComponent = TableRowCompact,
    RowProps,
    className,
    dense = false,
    displayMode = "default",
    header,
    onRowsSelected,
    rows,
}: TableProps) => {
    const mediumOrSmallScreen = useMediaQuery(useTheme().breakpoints.down("md")),
        classicModeRequired = (!mediumOrSmallScreen && displayMode === "default") || displayMode === "classic",
        compactModeRequired = (mediumOrSmallScreen && displayMode === "default") || displayMode === "compact";

    const [selectedRowsIds, selectedRowsIdsUpdate] = useState<TableRowProps["id"][]>([]),
        rowSelectionEnabled = typeof onRowsSelected === "function";

    const onRowSelect = useCallback(
        ({ id, checked }: { id: TableRowProps["id"]; checked: boolean }) =>
            selectedRowsIdsUpdate((latestState) =>
                checked
                    ? latestState.concat([id].filter((rowId) => !latestState.includes(rowId)))
                    : latestState.filter((rowId) => rowId !== id)
            ),

        [selectedRowsIdsUpdate]
    );

    useEffect(() => void onRowsSelected?.(selectedRowsIds), [selectedRowsIds]);

    return (
        <>
            {classicModeRequired && (
                <TableContainer className={clsx(_Table, className)}>
                    <table>
                        <TableHead className={`${_Table}-head`}>
                            <MuiTableRow>
                                {header.map((headerCell, index) => (
                                    <TableCell key={index}>{headerCell}</TableCell>
                                ))}
                            </MuiTableRow>
                        </TableHead>

                        <TableBody>
                            {(rows ?? header).map((row, index) => (
                                <RowComponent
                                    cells={typeof row !== "string" ? row.content : null}
                                    id={typeof row !== "string" ? row.id : index.toString()}
                                    key={`row-${index}`}
                                    onSelect={onRowSelect}
                                    selectable={rowSelectionEnabled}
                                    {...{ header }}
                                />
                            ))}
                        </TableBody>
                    </table>
                </TableContainer>
            )}

            {compactModeRequired && (
                <div className={clsx(`${_Table}--compact`, className)}>
                    {rows &&
                        rows.map((row, index) => (
                            <RowCompactComponent
                                cells={row.content}
                                id={row.id}
                                key={index}
                                onSelect={onRowSelect}
                                selectable={rowSelectionEnabled}
                                {...{ dense, header, ...RowProps }}
                            />
                        ))}
                </div>
            )}
        </>
    );
};
