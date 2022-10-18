import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import "./tile.scss";

const _Tile = "Tile";

export interface TileProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
    heading?: string | null;
}

export const Tile = ({ children, className, heading }: TileProps) => (
    <div className={_Tile}>
        {heading && <h1 className={`${_Tile}-heading`}>{heading}</h1>}
        <div className={clsx(`${_Tile}-content`, className)}>{children}</div>
    </div>
);
