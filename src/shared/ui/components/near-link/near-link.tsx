import { Account } from "near-api-js";
import { ArgsAccount } from "../../../lib/args";

export interface NearLinkProps {
    address: Account["accountId"];
}

export const NearLink = ({ address }: NearLinkProps) => {
    const addr = new ArgsAccount(address);

    return (
        <a
            href={addr.toUrl()}
            target="_blank"
            rel="noopener noreferrer"
        >
            {addr.value}
        </a>
    );
};
