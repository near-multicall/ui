import { Chip } from "@mui/material";
import clsx from "clsx";

import "./popup-menu.scss";

export const PopupMenu = ({ icon, items, triggerClassName }) => (
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
