import { TableContainer, TableHead, TableCell, TableRow as MuiTableRow, TableBody, styled } from "@mui/material";
import React from "react";

import { useBreakpoint } from "../../lib/breakpoints";
import { TableRow, TableRowCard, TableRowDefault, TableRowProps } from "./row";

const StyledTableContainer = styled(TableContainer)({
    display: "table",
    borderRadius: "40px",
    "& .MuiTableCell-root": {
        borderBottom: "none",
        fontWeight: 400,
        padding: "14px 20px",
        "&:first-of-type": {
            paddingLeft: 20,
        },
        "&:last-child": {
            paddingRight: 20,
        },
    },
    "& table": {
        width: "100%",
        borderCollapse: "separate",
        borderSpacing: "0 8px",
    },
});

const StyledTableHead = styled(TableHead)(({ theme }) => ({
    borderRadius: 8,
    overflow: "hidden",
    "& .MuiTableCell-root": {
        fontSize: "12px",
        whiteSpace: "pre",
        lineHeight: "12px",
        background: "rgba(255, 255, 255, 0.08)",
        padding: "12px 20px 12px 0",
        color: theme.palette.text.secondary,
        borderBottom: "none",
        "& .MuiTableSortLabel-root": {
            fontWeight: 400,
            fontSize: "12px!important",
            color: theme.palette.text.secondary,
        },
        "&:first-of-type": {
            paddingLeft: 20,
            borderTopLeftRadius: 8,
        },
        "&:last-child": {
            paddingRight: 20,
            borderTopRightRadius: 8,
        },
    },
}));

export const Table = ({
    header,
    rows = [["...", "...", "...", "..."]],
}: {
    header: TableRowProps["headerCells"];
    rows?: TableRowProps["cells"][];
}) => {
    const matches = useBreakpoint("md");

    return (
        <>
            {matches ? (
                <>
                    {rows.map((cells, index) => (
                        <TableRowCard
                            headerCells={header}
                            key={index}
                            {...{ cells }}
                        />
                    ))}
                </>
            ) : (
                <StyledTableContainer>
                    <table>
                        <StyledTableHead>
                            <MuiTableRow>
                                {header.map((headerCell, index) => (
                                    <TableCell key={index}>{headerCell}</TableCell>
                                ))}
                            </MuiTableRow>
                        </StyledTableHead>

                        <TableBody>
                            {rows.map((cells, index) => (
                                <TableRowDefault
                                    key={`row-${index}`}
                                    {...{ cells }}
                                />
                            ))}
                        </TableBody>
                    </table>
                </StyledTableContainer>
            )}
        </>
    );
};
