import { Checkbox, TableCell, TableRow as MuiTableRow } from "@mui/material";
import clsx from "clsx";
import { ChangeEvent, useCallback } from "react";

import { Color } from "../params";

import "./row.scss";

export type TableHeader = string[];

export interface TableRowProps {
    cells?: (string | number | JSX.Element)[] | null;
    centeredTitle?: boolean;
    dense?: boolean;
    /**
     * Display first cell of each row as its title in `"compact"` table `displayMode`
     */
    withTitle?: boolean;
    header: TableHeader;
    id: string;
    idToHighlight?: (id: TableRowProps["id"]) => Color | null;
    noKeys?: boolean;
    onSelect?: (selectedRow: { id: TableRowProps["id"]; checked: boolean }) => void;
    selectable: boolean;
    /**
     * Components that will be rendered inside the target slots of each row with row's id passed as prop
     */
    slots?: Partial<Record<"Start" | "End", ({ rowId }: { rowId: TableRowProps["id"] }) => JSX.Element>>;
}

export const TableRow = ({ cells, header }: TableRowProps) => (
    <>
        <MuiTableRow className="TableRow">
            {(cells ?? header).map((cell, index) => (
                <TableCell key={index}>{cells ? cell : "No data"}</TableCell>
            ))}
        </MuiTableRow>
    </>
);

export const TableRowCompact = ({
    cells,
    centeredTitle,
    dense,
    withTitle,
    header,
    id,
    idToHighlight,
    noKeys,
    onSelect,
    selectable,
    slots,
}: TableRowProps) => {
    const onSelectMemoized = useCallback(
        (_event: ChangeEvent, checked: boolean) => onSelect?.({ checked, id }),
        [onSelect]
    );

    return (
        <div
            className={clsx("TableRow--compact", {
                ["TableRow--compact--dense"]: dense,
                [`TableRow--highlighted--${idToHighlight?.(id)}`]: Boolean(idToHighlight?.(id)),
            })}
        >
            {header.map((headerCell, headerCellIndex) => (
                <div
                    className={clsx("TableRow-content--compact", {
                        ["TableRow-content--compact--dense"]: dense,
                        ["TableRow-content--compact--withTitle"]: withTitle,
                        ["TableRow-content--compact--withTitle--centeredTitle"]: centeredTitle,
                        ["TableRow-content--compact--noKeys"]: noKeys,
                    })}
                    key={headerCellIndex}
                >
                    {selectable && (
                        <div className="TableRow-content-checkbox">
                            <Checkbox onChange={onSelectMemoized} />
                        </div>
                    )}

                    {slots?.Start && (
                        <div className="TableRow-content-slot TableRow-content-slot--start">
                            <slots.Start rowId={id} />
                        </div>
                    )}

                    <span>{headerCell}</span>
                    <span>{cells ? cells[headerCellIndex] : "No data"}</span>

                    {slots?.End && (
                        <div className="TableRow-content-slot TableRow-content-slot--end">
                            <slots.End rowId={id} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
