import { TableCell, TableRow as MuiTableRow, Typography } from "@mui/material";

import "./row.scss";

const _TableRow = "Table-row";

export interface TableRowProps {
    cells?: (string | number | JSX.Element)[] | null;
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

const _TableRowCard = `${_TableRow}--compact`;

export const TableRowCard = ({ cells, headerCells }: TableRowProps) => (
    <div className={_TableRowCard}>
        {headerCells.map((headerCell, headerCellIndex) => (
            <div
                className={`${_TableRowCard}-content`}
                key={headerCellIndex}
            >
                <span>{headerCell}</span>
                <span>{cells ? cells[headerCellIndex] : "No data"}</span>
            </div>
        ))}
    </div>
);
