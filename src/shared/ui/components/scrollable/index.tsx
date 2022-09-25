import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import "./index.scss";

const NAMESPACE = "Scrollable";

interface ScrollableProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {}

export const Scrollable = ({ children, className }: ScrollableProps) => (
    <div className={clsx(NAMESPACE, className)}>{children}</div>
);
