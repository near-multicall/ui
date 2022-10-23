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
import { HTMLAttributes } from "react";

import { TableRowCompact, TableRow, type TableRowProps, TableHeader } from "./row";
import "./table.scss";

export interface TableProps extends HTMLAttributes<HTMLDivElement>, Pick<TableRowProps, "denseHeader"> {
    RowComponent?: typeof TableRow;
    RowCompactComponent?: typeof TableRowCompact;
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
    rows?: TableRowProps["cells"][] | null;
}

const _Table = "Table";

export const Table = ({
    RowComponent = TableRow,
    RowCompactComponent = TableRowCompact,
    className,
    denseHeader = false,
    displayMode = "default",
    header,
    rows,
}: TableProps) => {
    const mediumOrSmallScreen = useMediaQuery(useTheme().breakpoints.down("md")),
        classicModeRequired = (!mediumOrSmallScreen && displayMode === "default") || displayMode === "classic",
        compactModeRequired = (mediumOrSmallScreen && displayMode === "default") || displayMode === "compact";

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
                            {(rows ?? header).map((cells, index) => (
                                <RowComponent
                                    key={`row-${index}`}
                                    cells={typeof cells !== "string" ? cells : null}
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
                        rows.map((cells, index) => (
                            <RowCompactComponent
                                key={index}
                                {...{ cells, denseHeader, header }}
                            />
                        ))}
                </div>
            )}
        </>
    );
};
