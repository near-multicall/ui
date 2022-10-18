import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import "./tile.scss";

const _Tile = "Tile";

export interface TileProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
    title?: string;
}

export const Tile = ({ children, className, title }: TileProps) => (
    <div className={_Tile}>
        {title && <h1 className={`${_Tile}-title`}>{title}</h1>}
        <div className={clsx(`${_Tile}-content`, className)}>{children}</div>
    </div>
);
