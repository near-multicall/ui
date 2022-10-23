import { ArgsAccount } from "../../../shared/lib/args";
import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";

interface MIWhitelistedTokenProps {
    address: FungibleToken["address"];
}

const MIWhitelistedTokenEntry = ({ address }: MIWhitelistedTokenProps) => {
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

export const miWhitelistedTokenTableRowRender = (item: MIWhitelistedTokenProps["address"]) => [
    <MIWhitelistedTokenEntry address={item} />,
];
