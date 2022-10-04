import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import "./scrollable.scss";

const _Scrollable = "Scrollable";

interface ScrollableProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {}

export const Scrollable = ({ children, className }: ScrollableProps) => (
    <div className={clsx(_Scrollable, className)}>{children}</div>
);
