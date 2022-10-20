import { TableCell, TableRow as MuiTableRow, Typography } from "@mui/material";
import clsx from "clsx";

import "./row.scss";

const _TableRow = "Table-row";

export interface TableRowProps {
    cells?: (string | number | JSX.Element)[] | null;
    denseHeader?: boolean;
    headerCells: string[];
}

export const TableRow = ({ cells, headerCells }: TableRowProps) => (
    <>
        <MuiTableRow className={_TableRow}>
            {(cells ?? headerCells).map((cell, index) => (
                <TableCell key={index}>{cells ? cell : "No data"}</TableCell>
            ))}
        </MuiTableRow>
    </>
);

export const TableRowCard = ({ cells, denseHeader, headerCells }: TableRowProps) => (
    <div className={`${_TableRow}--compact`}>
        {headerCells.map((headerCell, headerCellIndex) => (
            <div
                className={clsx(`${_TableRow}-content--compact`, {
                    [`${_TableRow}-content--compact--denseHeader`]: denseHeader,
                })}
                key={headerCellIndex}
            >
                <span>{headerCell}</span>
                <span>{cells ? cells[headerCellIndex] : "No data"}</span>
            </div>
        ))}
    </div>
);
