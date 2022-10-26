import { TableCell, TableRow as MuiTableRow, Typography } from "@mui/material";
import clsx from "clsx";

import "./row.scss";

const _TableRow = "Table-row";

export type TableHeader = string[];

export interface TableRowProps {
    cells?: (string | number | JSX.Element)[] | null;
    centeredTitle?: boolean;
    dense?: boolean;
    /**
     * Display first cell of each row as its title in `"compact"` table `displayMode`
     */
    entitled?: boolean;
    header: TableHeader;
    noKeys?: boolean;
}

export const TableRow = ({ cells, header }: TableRowProps) => (
    <>
        <MuiTableRow className={_TableRow}>
            {(cells ?? header).map((cell, index) => (
                <TableCell key={index}>{cells ? cell : "No data"}</TableCell>
            ))}
        </MuiTableRow>
    </>
);

export const TableRowCompact = ({ cells, centeredTitle, dense, entitled, header, noKeys }: TableRowProps) => (
    <div
        className={clsx(`${_TableRow}--compact`, {
            [`${_TableRow}--compact--dense`]: dense,
        })}
    >
        {header.map((headerCell, headerCellIndex) => (
            <div
                className={clsx(_TableRow + "-content" + "--compact", {
                    [_TableRow + "-content" + "--compact" + "--dense"]: dense,
                    [_TableRow + "-content" + "--compact" + "--entitled"]: entitled,
                    [_TableRow + "-content" + "--compact" + "--entitled" + "--centeredTitle"]: centeredTitle,
                    [_TableRow + "-content" + "--compact" + "--noKeys"]: noKeys,
                })}
                key={headerCellIndex}
            >
                <span>{headerCell}</span>
                <span>{cells ? cells[headerCellIndex] : "No data"}</span>
            </div>
        ))}
    </div>
);
