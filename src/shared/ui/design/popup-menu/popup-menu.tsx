import { Chip } from "@mui/material";
import clsx from "clsx";
import { ReactNode } from "react";

import "./popup-menu.scss";

interface PopupMenuProps {
    icon: ReactNode;
    align: "top" | "bottom";
    items: { disabled?: boolean; label?: string; onClick?: VoidFunction; title: string }[];
    triggerClassName: string;
}

export const PopupMenu = ({ icon, align = "top", items, triggerClassName }: PopupMenuProps) => (
    <div className={clsx("PopupMenu", triggerClassName)}>
        {icon}

        <div
            className={clsx("PopupMenu-content", {
                "align-top": align === "top",
                "align-bottom": align === "bottom",
            })}
        >
            <ul>
                {items.map(({ disabled = false, label, onClick, title }, i) => (
                    <li
                        className={clsx({ disabled })}
                        key={i}
                        /*
                         * `undefined` is being used here because native HTML elements
                         * doesn't accept `null` as onClick prop
                         */
                        onClick={disabled ? undefined : onClick}
                    >
                        {title}
                        {label && <Chip {...{ label }} />}
                    </li>
                ))}
            </ul>
        </div>
    </div>
);
