import { Chip } from "@mui/material";
import clsx from "clsx";
import { ReactNode } from "react";

import "./index.scss";

interface PopupMenuProps {
    icon: ReactNode;
    items: { label: string; onClick: VoidFunction; title: string }[];
    triggerClassName: string;
}

export const PopupMenu = ({ icon, items, triggerClassName }: PopupMenuProps) => (
    <div className={clsx("popup-menu", triggerClassName)}>
        {icon}

        <div className="popup-menu-content">
            <ul>
                {items.map(({ label, onClick, title }) => (
                    <li
                        key={title}
                        {...{ onClick }}
                    >
                        {title}
                        {label && <Chip {...{ label }} />}
                    </li>
                ))}
            </ul>
        </div>
    </div>
);
