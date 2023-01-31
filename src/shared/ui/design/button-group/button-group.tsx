import clsx from "clsx";
import { HTMLProps } from "react";

import "./button-group.scss";

export interface ButtonGroupProps extends HTMLProps<HTMLDivElement> {
    placement?: "auto" | "end" | "start";
}

export const ButtonGroup = ({ children, className, placement = "auto" }: ButtonGroupProps) => (
    <div className={clsx("ButtonGroup", `ButtonGroup--${placement}`, className)}>{children}</div>
);
