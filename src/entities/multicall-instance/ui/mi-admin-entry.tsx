import { Account } from "near-api-js";

import { ArgsAccount } from "../../../shared/lib/args";

interface MIAdminEntryProps {
    address: Account["accountId"];
}

const MIAdminEntry = ({ address }: MIAdminEntryProps) => {
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

export const multicallAdminTableRow = (address: MIAdminEntryProps["address"]) => [<MIAdminEntry {...{ address }} />];
