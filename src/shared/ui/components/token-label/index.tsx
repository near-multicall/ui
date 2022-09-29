import { NearIcons } from "../icons";
import "./index.scss";

const TokenLabelNamespace = "TokenLabel";

interface TokenLabelProps {
    icon?: string | null;
    native?: boolean;
    symbol?: string;
}

export const TokenLabel = ({ icon, native, symbol }: TokenLabelProps) => (
    <span className={TokenLabelNamespace}>
        {!native && typeof icon === "string" ? (
            <img
                className={`${TokenLabelNamespace}-icon`}
                loading="lazy"
                src={icon}
            />
        ) : native ? (
            <NearIcons.NativeTokenFilled className={`${TokenLabelNamespace}-icon`} />
        ) : (
            <NearIcons.GenericTokenFilled className={`${TokenLabelNamespace}-icon`} />
        )}

        <span className={`${TokenLabelNamespace}-symbol`}>{native ? "NEAR" : symbol}</span>
    </span>
);
