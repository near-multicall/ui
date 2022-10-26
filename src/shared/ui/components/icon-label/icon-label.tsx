import clsx from "clsx";

import { Validation } from "../../../lib/validation";

import "./icon-label.scss";

const _IconLabel = "IconLabel";

interface IconLabelProps {
    icon: string | JSX.Element;
    label: string;
    reversed?: boolean;
}

export const IconLabel = ({ icon, label, reversed = false }: IconLabelProps) => (
    <span
        className={clsx(_IconLabel, {
            [_IconLabel + "--reversed"]: reversed,
            [_IconLabel + "--symbolic"]: typeof icon === "string" && !Validation.isUrl(icon),
        })}
    >
        <span className={_IconLabel + "-icon"}>
            {typeof icon === "string" && Validation.isUrl(icon) ? (
                <img
                    loading="lazy"
                    src={icon}
                />
            ) : (
                icon
            )}
        </span>

        <span className={_IconLabel + "-label"}>{label}</span>
    </span>
);
