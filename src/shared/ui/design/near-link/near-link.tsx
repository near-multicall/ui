import { Account } from "@near-wallet-selector/core";

import { ArgsAccount } from "../../../lib/args-old";
import { Link, LinkProps } from "../link";

import "./near-link.scss";

export interface NearLinkProps extends Omit<LinkProps, "href"> {
    address: Account["accountId"];
}

const _NearLink = "NearLink";

export const NearLink = ({ address }: NearLinkProps) => {
    const addr = new ArgsAccount(address);

    return (
        <Link
            className={_NearLink}
            href={addr.toUrl()}
            label={addr.value}
            rel="noopener noreferrer"
            target="_blank"
        />
    );
};
