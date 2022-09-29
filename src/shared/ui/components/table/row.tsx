import { TableCell, TableRow as MuiTableRow, Typography } from "@mui/material";

import "./row.scss";

const TableRowNamespace = "Table-row";

export interface TableRowProps {
    cells?: (string | number | JSX.Element)[] | null;
    headerCells: string[];
}

export const TableRow = ({ cells, headerCells }: TableRowProps) => (
    <>
        <MuiTableRow className={TableRowNamespace}>
            {(cells || headerCells).map((cell, index) => (
                <TableCell key={index}>{cells ? cell : "No data"}</TableCell>
            ))}
        </MuiTableRow>
    </>
);

const TableRowCardNamespace = `${TableRowNamespace}--card`;

export const TableRowCard = ({ cells, headerCells }: TableRowProps) => (
    <div className={TableRowCardNamespace}>
        {headerCells.map((headerCell, headerCellIndex) => (
            <div
                className={`${TableRowCardNamespace}-content`}
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
                    {cells ? cells[headerCellIndex] : "No data"}
                </Typography>
            </div>
        ))}
    </div>
);

/*
export interface TableRowProps extends TableRowDefaultProps, TableRowCardProps {}

export const TableRow = (props: TableRowProps) => (
    <>
        <TableRow {...props} />
        <TableRowCard {...props} />
    </>
);
*/
