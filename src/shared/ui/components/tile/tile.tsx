import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import "./tile.scss";

const _Tile = "Tile";

export interface TileProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {}

export const Tile = ({ children, className }: TileProps) => <div className={clsx(_Tile, className)}>{children}</div>;
