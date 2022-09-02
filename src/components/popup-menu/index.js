import { Chip } from "@mui/material";
import clsx from "clsx";

import "./index.scss";

export const PopupMenu = ({ Icon, items, triggerClassName }) => (
    <div className={clsx("popup-menu", triggerClassName)}>
        {Icon}

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
