import { Validation } from "../../../lib/validation";

import "./icon-label.scss";

const _IconLabel = "IconLabel";

interface IconLabelProps {
    icon: string | JSX.Element;
    label: string;
}

export const IconLabel = ({ icon, label }: IconLabelProps) => (
    <span className={_IconLabel}>
        <span className={`${_IconLabel}-icon`}>
            {typeof icon === "string" && Validation.isUrl(icon) ? (
                <img
                    loading="lazy"
                    src={icon}
                />
            ) : (
                icon
            )}
        </span>

        <span className={`${_IconLabel}-label`}>{label}</span>
    </span>
);
