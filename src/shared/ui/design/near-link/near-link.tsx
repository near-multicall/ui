import { args } from "../../../lib/args/args";
import { Link, LinkProps } from "../link";

import "./near-link.scss";

export interface NEARLinkProps extends Omit<LinkProps, "href"> {
    address: AccountId;
}

const _NEARLink = "NEARLink";

export const NEARLink = ({ address }: NEARLinkProps) => (
    <Link
        className={_NEARLink}
        href={args.string().address().intoUrl().cast(address) ?? "#"}
        label={address}
        rel="noopener noreferrer"
        target="_blank"
    />
);
