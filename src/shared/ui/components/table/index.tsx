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

import { TableRowCard, TableRowDefault, TableRowProps } from "./row";
import "./index.scss";

export const Table = ({
    header,
    rows = [["...", "...", "...", "..."]],
}: {
    header: TableRowProps["headerCells"];
    rows?: TableRowProps["cells"][];
}) => {
    const matches = useMediaQuery(useTheme().breakpoints.down("md"));

    return (
        <>
            {matches ? (
                <div className="Table--column">
                    {rows.map((cells, index) => (
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
                            {rows.map((cells, index) => (
                                <TableRowDefault
                                    key={`row-${index}`}
                                    {...{ cells }}
                                />
                            ))}
                        </TableBody>
                    </table>
                </TableContainer>
            )}
        </>
    );
};
