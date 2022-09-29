import {
    TableContainer,
    TableHead,
    TableCell,
    TableRow as MuiTableRow,
    TableBody,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import React from "react";

import { TableRowCard, TableRow, type TableRowProps } from "./row";
import "./index.scss";

interface TableProps {
    header: TableRowProps["headerCells"];
    rows?: TableRowProps["cells"][];
}

export const Table = ({ header, rows }: TableProps) => {
    const matches = useMediaQuery(useTheme().breakpoints.down("md"));

    return (
        <>
            {matches ? (
                <div className="Table--column">
                    {rows &&
                        rows.map((cells, index) => (
                            <TableRowCard
                                headerCells={header}
                                key={index}
                                {...{ cells }}
                            />
                        ))}
                </div>
            ) : (
                <TableContainer className="table-container">
                    <table>
                        <TableHead className="table-head">
                            <MuiTableRow>
                                {header.map((headerCell, index) => (
                                    <TableCell key={index}>{headerCell}</TableCell>
                                ))}
                            </MuiTableRow>
                        </TableHead>

                        <TableBody>
                            {(rows || header).map((cells, index) => (
                                <TableRow
                                    headerCells={header}
                                    key={`row-${index}`}
                                    cells={typeof cells !== "string" ? cells : null}
                                />
                            ))}
                        </TableBody>
                    </table>
                </TableContainer>
            )}
        </>
    );
};
