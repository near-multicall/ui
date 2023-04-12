import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

import "./button.scss";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    color?: "default" | "success" | "error";
    label: string;
    noRender?: boolean;
}

export const Button = ({ className, color = "default", label = "Submit", noRender = false, ...props }: ButtonProps) =>
    noRender ? null : (
        <button
            className={clsx("Button", `Button--${color}`, className)}
            {...props}
        >
            <span className="Button-label">{label}</span>
        </button>
    );
