import { Account } from "@near-wallet-selector/core";

import { args } from "../../../lib/args/args";
import { Link, LinkProps } from "../link";

import "./near-link.scss";

export interface NearLinkProps extends Omit<LinkProps, "href"> {
    address: Account["accountId"];
}

const _NearLink = "NearLink";

export const NearLink = ({ address }: NearLinkProps) => (
    <Link
        className={_NearLink}
        href={args.string().address().intoUrl().cast(address) ?? "#"}
        label={address}
        rel="noopener noreferrer"
        target="_blank"
    />
);
