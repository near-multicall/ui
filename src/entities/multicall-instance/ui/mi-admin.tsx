import { NearLink, type NearLinkProps } from "../../../shared/ui/design";

interface MIAdminProps extends NearLinkProps {}

const MIAdmin = ({ address }: MIAdminProps) => (
    <span>
        <NearLink {...{ address }} />
    </span>
);

export const miAdminAsTableRow = (item: MIAdminProps["address"]) => ({
    content: [<MIAdmin address={item} />],
    id: item,
});
