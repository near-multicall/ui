import { TableCell, TableRow as MuiTableRow, Typography } from "@mui/material";
import React from "react";

import "./row.scss";

interface TableRowDefaultProps {
    cells?: (string | number | JSX.Element)[] | null;
}

export const TableRowDefault = ({ cells }: TableRowDefaultProps) => (
    <>
        <MuiTableRow className="table-row-default">
            {cells && cells.map((cell, index) => <TableCell key={index}>{cell}</TableCell>)}
        </MuiTableRow>
    </>
);

interface TableRowCardProps extends TableRowDefaultProps {
    headerCells: string[];
}

export const TableRowCard = ({ cells, headerCells }: TableRowCardProps) => (
    <div className="table-row-card">
        {headerCells.map((headerCell, headerCellIndex) => (
            <div
                className="content"
                key={headerCellIndex}
            >
                <Typography
                    variant="inherit"
                    component="div"
                    fontSize="2rem"
                    color="#000000"
                >
                    {headerCell}
                </Typography>

                <Typography
                    component="div"
                    fontSize="2rem"
                >
                    {cells && cells[headerCellIndex]}
                </Typography>
            </div>
        ))}
    </div>
);

export interface TableRowProps extends TableRowDefaultProps, TableRowCardProps {}

export const TableRow = (props: TableRowProps) => (
    <>
        <TableRowDefault {...props} />
        <TableRowCard {...props} />
    </>
);
