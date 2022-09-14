import { Chip } from "@mui/material";
import clsx from "clsx";

import "./popup-menu.scss";

export const PopupMenu = ({ icon, items, triggerClassName }) => (
    <div className={clsx("popup-menu", triggerClassName)}>
        {icon}

        <div className="popup-menu-content">
            <ul>
                {items.map(({ disabled = false, label, onClick, title }) => (
                    <li
                        className={clsx({ disabled })}
                        key={title}
                        onClick={disabled ? null : onClick}
                    >
                        {title}
                        {label && <Chip {...{ label }} />}
                    </li>
                ))}
            </ul>
        </div>
    </div>
);
