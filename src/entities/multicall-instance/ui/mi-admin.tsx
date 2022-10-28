import { NearLink, type NearLinkProps } from "../../../shared/ui/components";

interface MulticallInstanceAdminProps extends NearLinkProps {}

const MulticallInstanceAdmin = ({ address }: MulticallInstanceAdminProps) => (
    <span>
        <NearLink {...{ address }} />
    </span>
);

export const multicallInstanceAdminToTableRow = (item: MulticallInstanceAdminProps["address"]) => ({
    content: [<MulticallInstanceAdmin address={item} />],
    id: item,
});
