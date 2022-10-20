import clsx from "clsx";
import { HTMLProps } from "react";

import "./button-group.scss";

export interface ButtonGroupProps extends HTMLProps<HTMLDivElement> {
    placement?: "end" | "start";
}

const _ButtonGroup = "ButtonGroup";

export const ButtonGroup = ({ children, className, placement = "end" }: ButtonGroupProps) => (
    <div className={clsx(_ButtonGroup, `${_ButtonGroup}--${placement}`, className)}>{children}</div>
);
