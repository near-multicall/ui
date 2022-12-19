import { NEARLink, NEARLinkProps } from "../../../shared/ui/design";

export interface MIAdminProps extends NEARLinkProps {}

const MIAdmin = ({ address }: MIAdminProps) => (
    <span>
        <NEARLink {...{ address }} />
    </span>
);

export const miAdminAsTableRow = (item: MIAdminProps["address"]) => ({
    content: [<MIAdmin address={item} />],
    id: item,
});
