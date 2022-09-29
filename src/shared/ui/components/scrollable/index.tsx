import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import "./index.scss";

const ScrollableNamespace = "Scrollable";

interface ScrollableProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {}

export const Scrollable = ({ children, className }: ScrollableProps) => (
    <div className={clsx(ScrollableNamespace, className)}>{children}</div>
);
