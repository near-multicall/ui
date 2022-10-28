import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";
import { NearLink } from "../../../shared/ui/components";

interface MulticallInstanceWhitelistedTokenProps {
    address: FungibleToken["address"];
}

const MulticallInstanceWhitelistedToken = ({ address }: MulticallInstanceWhitelistedTokenProps) => (
    <span>
        <NearLink {...{ address }} />
    </span>
);

export const multicallInstanceWhitelistedTokenToTableRow = (
    item: MulticallInstanceWhitelistedTokenProps["address"]
) => ({
    content: [<MulticallInstanceWhitelistedToken address={item} />],
    id: item,
});
