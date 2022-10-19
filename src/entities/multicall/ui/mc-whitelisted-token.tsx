import { ArgsAccount } from "../../../shared/lib/args";
import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";

interface MulticallWhitelistedTokenProps {
    address: FungibleToken["address"];
}

const MulticallWhitelistedTokenEntry = ({ address }: MulticallWhitelistedTokenProps) => {
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

export const multicallWhitelistedTokenTableRow = (address: MulticallWhitelistedTokenProps["address"]) => [
    <MulticallWhitelistedTokenEntry {...{ address }} />,
];
