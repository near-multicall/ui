import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import "./scrollable.scss";

interface ScrollableProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {}

export const Scrollable = ({ children, className }: ScrollableProps) => (
    <div className={clsx("Scrollable", className)}>{children}</div>
);
