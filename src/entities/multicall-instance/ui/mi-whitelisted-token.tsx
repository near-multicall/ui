import { ArgsAccount } from "../../../shared/lib/args";
import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";

interface MulticallInstanceWhitelistedTokenProps {
    address: FungibleToken["address"];
}

const MulticallInstanceWhitelistedTokenEntry = ({ address }: MulticallInstanceWhitelistedTokenProps) => {
    const addr = new ArgsAccount(address);

    return (
        <span>
            <a
                href={addr.toUrl()}
                target="_blank"
                rel="noopener noreferrer"
            >
                {addr.value}
            </a>
        </span>
    );
};

export const miWhitelistedTokenTableRowRender = (item: MulticallInstanceWhitelistedTokenProps["address"]) => [
    <MulticallInstanceWhitelistedTokenEntry address={item} />,
];
