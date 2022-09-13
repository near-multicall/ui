import React from "react";

import { NearGenericTokenIconFilled, NearIconFilled } from "../icons";
import "./token-label.scss";

export const TokenLabel = ({
    icon,
    native,
    symbol,
}: {
    icon?: string | JSX.Element | null;
    native?: boolean;
    symbol?: string;
}) => (
    <span className="token-label">
        {!native && typeof icon === "string" ? (
            <img
                className="icon"
                loading="lazy"
                src={icon}
            />
        ) : (
            <span className="icon">{native ? <NearIconFilled /> : icon || <NearGenericTokenIconFilled />}</span>
        )}

        <span className="symbol">{native ? "NEAR" : symbol}</span>
    </span>
);
