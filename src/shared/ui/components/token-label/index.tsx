import { NearIcons } from "../icons";
import "./token-label.scss";

const _TokenLabel = "TokenLabel";

interface TokenLabelProps {
    icon?: string | null;
    native?: boolean;
    symbol?: string;
}

export const TokenLabel = ({ icon, native, symbol }: TokenLabelProps) => (
    <span className={_TokenLabel}>
        {!native && typeof icon === "string" ? (
            <img
                className={`${_TokenLabel}-icon`}
                loading="lazy"
                src={icon}
            />
        ) : native ? (
            <NearIcons.NativeTokenFilled className={`${_TokenLabel}-icon`} />
        ) : (
            <NearIcons.GenericTokenFilled className={`${_TokenLabel}-icon`} />
        )}

        <span className={`${_TokenLabel}-symbol`}>{native ? "NEAR" : symbol}</span>
    </span>
);
