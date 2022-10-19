import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import { Placeholder } from "../placeholder";

import "./tile.scss";

const _Tile = "Tile";

export interface TileProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
    error?: Error | null;
    heading?: string | null;
    loading?: boolean;
    noData?: boolean;
}

export const Tile = ({ children, className, error, heading, loading = false, noData = false }: TileProps) => (
    <div className={_Tile}>
        {heading && <h1 className={`${_Tile}-heading`}>{heading}</h1>}

        <div className={clsx(`${_Tile}-content`, className)}>
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
