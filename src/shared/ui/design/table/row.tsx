import { Checkbox, TableCell, TableRow as MuiTableRow } from "@mui/material";
import clsx from "clsx";
import { ChangeEvent, useCallback } from "react";

import { Color } from "../module-context";

import "./row.scss";

const _TableRow = "TableRow";

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
    idToHighlightColor?: (id: TableRowProps["id"]) => Color | null;
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
        <MuiTableRow className={_TableRow}>
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
    idToHighlightColor,
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
            className={clsx(`${_TableRow}--compact`, {
                [`${_TableRow}--compact--dense`]: dense,
                [`${_TableRow}--highlighted--${idToHighlightColor?.(id)}`]: Boolean(idToHighlightColor?.(id)),
            })}
        >
            {header.map((headerCell, headerCellIndex) => (
                <div
                    className={clsx(`${_TableRow}-content--compact`, {
                        [`${_TableRow}-content--compact--dense`]: dense,
                        [`${_TableRow}-content--compact--withTitle`]: withTitle,
                        [`${_TableRow}-content--compact--withTitle--centeredTitle`]: centeredTitle,
                        [`${_TableRow}-content--compact--noKeys`]: noKeys,
                    })}
                    key={headerCellIndex}
                >
                    {selectable && (
                        <div className={`${_TableRow}-content-checkbox`}>
                            <Checkbox onChange={onSelectMemoized} />
                        </div>
                    )}

                    {slots?.Start && (
                        <div className={clsx(`${_TableRow}-content-slot`, `${_TableRow}-content-slot--start`)}>
                            <slots.Start rowId={id} />
                        </div>
                    )}

                    <span>{headerCell}</span>
                    <span>{cells ? cells[headerCellIndex] : "No data"}</span>

                    {slots?.End && (
                        <div className={clsx(`${_TableRow}-content-slot`, `${_TableRow}-content-slot--end`)}>
                            <slots.End rowId={id} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
