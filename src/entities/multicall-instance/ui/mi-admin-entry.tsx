import { Account } from "near-api-js";

import { ArgsAccount } from "../../../shared/lib/args";

interface MulticallInstanceAdminEntryProps {
    address: Account["accountId"];
}

const MulticallInstanceAdminEntry = ({ address }: MulticallInstanceAdminEntryProps) => {
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

export const multicallAdminTableRow = (address: MulticallInstanceAdminEntryProps["address"]) => [
    <MulticallInstanceAdminEntry {...{ address }} />,
];
