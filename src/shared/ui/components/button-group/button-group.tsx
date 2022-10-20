import clsx from "clsx";
import { HTMLProps } from "react";

import "./button-group";

export interface ButtonGroupProps extends HTMLProps<HTMLDivElement> {}

const _ButtonGroup = "ButtonGroup";

export const ButtonGroup = ({ children, className }: ButtonGroupProps) => (
    <div className={clsx(_ButtonGroup, className)}>{children}</div>
);
