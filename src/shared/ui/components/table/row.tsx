import { TableCell, TableRow as MuiTableRow, Typography } from "@mui/material";
import clsx from "clsx";

import "./row.scss";

const _TableRow = "Table-row";

export type TableHeader = string[];

export interface TableRowProps {
    cells?: (string | number | JSX.Element)[] | null;
    dense?: boolean;
    header: TableHeader;
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

export const TableRowCompact = ({ cells, dense, header }: TableRowProps) => (
    <div
        className={clsx(`${_TableRow}--compact`, {
            [`${_TableRow}--compact--dense`]: dense,
        })}
    >
        {header.map((headerCell, headerCellIndex) => (
            <div
                className={clsx(`${_TableRow}-content--compact`, {
                    [`${_TableRow}-content--compact--dense`]: dense,
                })}
                key={headerCellIndex}
            >
                <span>{headerCell}</span>
                <span>{cells ? cells[headerCellIndex] : "No data"}</span>
            </div>
        ))}
    </div>
);
