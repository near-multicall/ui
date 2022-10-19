import { Account } from "near-api-js";

import { ArgsAccount } from "../../../shared/lib/args";

interface MulticallAdminEntryProps {
    address: Account["accountId"];
}

const MulticallAdminEntry = ({ address }: MulticallAdminEntryProps) => {
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

export const multicallAdminTableRow = (address: MulticallAdminEntryProps["address"]) => [
    <MulticallAdminEntry {...{ address }} />,
];
