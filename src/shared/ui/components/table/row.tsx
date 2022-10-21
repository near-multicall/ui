import { TableCell, TableRow as MuiTableRow, Typography } from "@mui/material";
import clsx from "clsx";

import "./row.scss";

const _TableRow = "Table-row";

export type TableHeader = string[];

export interface TableRowProps {
    cells?: (string | number | JSX.Element)[] | null;
    denseHeader?: boolean;
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

export const TableRowCard = ({ cells, denseHeader, header }: TableRowProps) => (
    <div className={`${_TableRow}--compact`}>
        {header.map((headerCell, headerCellIndex) => (
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
