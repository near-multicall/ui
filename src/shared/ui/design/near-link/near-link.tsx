import { ArgsAccount } from "../../../lib/args-old";
import { Link, LinkProps } from "../link";

export interface NearLinkProps extends Omit<LinkProps, "href"> {
    address: string;
}

export const NearLink = ({ address }: NearLinkProps) => {
    const addr = new ArgsAccount(address);

    return (
        <Link
            href={addr.toUrl()}
            label={addr.value}
            rel="noopener noreferrer"
            target="_blank"
        />
    );
};
