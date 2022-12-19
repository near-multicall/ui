import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";
import { NEARLink } from "../../../shared/ui/design";

export interface MIWhitelistedTokenProps {
    address: FungibleToken["address"];
}

const MIWhitelistedToken = ({ address }: MIWhitelistedTokenProps) => (
    <span>
        <NEARLink {...{ address }} />
    </span>
);

export const miWhitelistedTokenAsTableRow = (item: MIWhitelistedTokenProps["address"]) => ({
    content: [<MIWhitelistedToken address={item} />],
    id: item,
});
