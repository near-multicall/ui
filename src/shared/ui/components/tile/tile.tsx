import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import "./tile.scss";

const _Tile = "Tile";

export interface TileProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
    title: string;
}

export const Tile = ({ children, className, title }: TileProps) => (
    <div className={clsx(_Tile, className)}>
        <h1 className={`${_Tile}-title`}>{title}</h1>
        {children}
    </div>
);
