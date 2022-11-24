import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";
import { NearLink } from "../../../shared/ui/design";

export interface MIWhitelistedTokenProps {
    address: FungibleToken["address"];
}

const MIWhitelistedToken = ({ address }: MIWhitelistedTokenProps) => (
    <span>
        <NearLink {...{ address }} />
    </span>
);

export const miWhitelistedTokenAsTableRow = (item: MIWhitelistedTokenProps["address"]) => ({
    content: [<MIWhitelistedToken address={item} />],
    id: item,
});
