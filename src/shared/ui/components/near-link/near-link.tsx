import { Account } from "near-api-js";

import { ArgsAccount } from "../../../lib/args";
import { Link, LinkProps } from "../link";

export interface NearLinkProps extends Omit<LinkProps, "href"> {
    address: Account["accountId"];
}

export const NearLink = ({ address }: NearLinkProps) => {
    const addr = new ArgsAccount(address);

    return (
        <Link
            href={addr.toUrl()}
            target="_blank"
            rel="noopener noreferrer"
        >
            {addr.value}
        </Link>
    );
};
