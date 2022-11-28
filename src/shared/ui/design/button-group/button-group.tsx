import clsx from "clsx";
import { HTMLProps } from "react";

import "./button-group.scss";

export interface ButtonGroupProps extends HTMLProps<HTMLDivElement> {
    placement?: "auto" | "end" | "start";
}

const _ButtonGroup = "ButtonGroup";

export const ButtonGroup = ({ children, className, placement = "auto" }: ButtonGroupProps) => (
    <div className={clsx(_ButtonGroup, `${_ButtonGroup}--${placement}`, className)}>{children}</div>
);
