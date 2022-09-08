import React from "react";

import { NearGenericTokenIconFilled } from "../../shared/ui/components/icons/near";
import "./token.scss";

export const TokenLabel = ({
    icon = <NearGenericTokenIconFilled />,
    symbol,
}: {
    icon: string | JSX.Element;
    symbol: string;
}) => (
    <span className="token-label">
        {typeof icon === "string" ? (
            <img
                className="icon"
                loading="lazy"
                src={icon}
            />
        ) : (
            <span className="icon">{icon}</span>
        )}

        <span className="symbol">{symbol}</span>
    </span>
);
