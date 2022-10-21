import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import { Placeholder } from "../placeholder";

import "./tile.scss";

const _Tile = "Tile";

export interface TileProps extends PropsWithChildren, Omit<HTMLAttributes<HTMLDivElement>, "className"> {
    classes?: Partial<Record<"root" | "heading" | "content", HTMLAttributes<HTMLDivElement>["className"]>>;
    error?: Error | null;
    heading?: string | null;
    headingSlotsContent?: { left?: JSX.Element; right?: JSX.Element };
    loading?: boolean;
    noData?: boolean;
}

export const Tile = ({
    children,
    classes,
    error,
    heading,
    headingSlotsContent,
    loading = false,
    noData = false,
}: TileProps) => (
    <div className={clsx(_Tile, classes?.root)}>
        {heading && (
            <span className={clsx(`${_Tile}-heading`, classes?.heading)}>
                {headingSlotsContent?.left && (
                    <span className={`${_Tile}-heading-slot--left`}>{headingSlotsContent?.left}</span>
                )}

                <h1 className={`${_Tile}-heading-text`}>{heading}</h1>

                {headingSlotsContent?.right && (
                    <span className={`${_Tile}-heading-slot--right`}>{headingSlotsContent?.right}</span>
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
    </div>
);
