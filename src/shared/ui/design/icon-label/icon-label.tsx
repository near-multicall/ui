import clsx from "clsx";

import { Validation } from "../../../lib/validation";

import "./icon-label.scss";

interface IconLabelProps {
    icon: string | JSX.Element;
    label: string;
    reversed?: boolean;
}

export const IconLabel = ({ icon, label, reversed = false }: IconLabelProps) => (
    <span
        className={clsx("IconLabel", {
            ["IconLabel--reversed"]: reversed,
            ["IconLabel--symbolic"]: typeof icon === "string" && !Validation.isUrl(icon),
        })}
    >
        <span className="IconLabel-icon">
            {typeof icon === "string" && Validation.isUrl(icon) ? (
                <img
                    loading="lazy"
                    src={icon}
                />
            ) : (
                icon
            )}
        </span>

        <span className={clsx("IconLabel-label", { "font--code": !Number.isNaN(label) })}>{label}</span>
    </span>
);
