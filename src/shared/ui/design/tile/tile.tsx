import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import { Placeholder } from "../placeholder";

import "./tile.scss";

const _Tile = "Tile";

export interface TileProps extends PropsWithChildren, Omit<HTMLAttributes<HTMLDivElement>, "className"> {
    classes?: Partial<
        Record<"root" | "content" | "footer" | "header" | "subheader", HTMLAttributes<HTMLDivElement>["className"]>
    >;
    error?: Error | null;
    footer?: JSX.Element;
    heading?: string | null;
    headerSlots?: { start?: JSX.Element; end?: JSX.Element };
    loading?: boolean;
    noData?: boolean;
    order?: "default" | "swapped";
    subheader?: JSX.Element;
}

export const Tile = ({
    children,
    classes,
    error,
    footer,
    heading,
    headerSlots,
    loading = false,
    noData = false,
    order = "default",
    subheader,
}: TileProps) => (
    <div className={clsx(_Tile, `${_Tile}--${order}`, classes?.root)}>
        <span className={clsx(`${_Tile}-header`, classes?.header)}>
            {headerSlots?.start && <span className={`${_Tile}-header-slot--start`}>{headerSlots?.start}</span>}
            {heading && <h1 className={`${_Tile}-header-text`}>{heading}</h1>}
            {headerSlots?.end && <span className={`${_Tile}-header-slot--end`}>{headerSlots?.end}</span>}
        </span>

        {subheader && <div className={clsx(`${_Tile}-subheader`, classes?.subheader)}>{subheader}</div>}

        <div className={clsx(`${_Tile}-content`, classes?.content)}>
            {loading && <div className="loader" />}
            {!loading && noData && <Placeholder type="noData" />}

            {!loading && error && (
                <Placeholder
                    payload={{ error }}
                    type="unknownError"
                />
            )}

            {!loading && !noData && !error && children}
        </div>

        {footer && <div className={clsx(`${_Tile}-footer`, classes?.footer)}>{footer}</div>}
    </div>
);
