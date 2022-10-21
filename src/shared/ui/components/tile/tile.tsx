import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import { Placeholder } from "../placeholder";

import "./tile.scss";

const _Tile = "Tile";

export interface TileProps extends PropsWithChildren, Omit<HTMLAttributes<HTMLDivElement>, "className"> {
    classes?: Partial<Record<"root" | "content" | "footer" | "heading", HTMLAttributes<HTMLDivElement>["className"]>>;
    error?: Error | null;
    footer?: JSX.Element | null;
    heading?: string | null;
    headingCorners?: { left?: JSX.Element; right?: JSX.Element };
    loading?: boolean;
    noData?: boolean;
}

export const Tile = ({
    children,
    classes,
    error,
    footer,
    heading,
    headingCorners,
    loading = false,
    noData = false,
}: TileProps) => (
    <div className={clsx(_Tile, classes?.root)}>
        {heading && (
            <span className={clsx(`${_Tile}-heading`, classes?.heading)}>
                {headingCorners?.left && (
                    <span className={`${_Tile}-heading-corner--left`}>{headingCorners?.left}</span>
                )}

                <h1 className={`${_Tile}-heading-text`}>{heading}</h1>

                {headingCorners?.right && (
                    <span className={`${_Tile}-heading-corner--right`}>{headingCorners?.right}</span>
                )}
            </span>
        )}

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
