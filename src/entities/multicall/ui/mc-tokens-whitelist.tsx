import clsx from "clsx";

import { Scrollable, Table, Tile } from "../../../shared/ui/components";
import { MulticallTokensModel } from "../model/mc-tokens";
import { type MulticallEntity } from "../config";

import { multicallWhitelistedTokenTableRow } from "./mc-whitelisted-token";

interface MulticallTokensWhitelistTableProps extends MulticallEntity.Dependencies {
    additionalItems?: JSX.Element[][];
    className?: string;
    toolbarContent?: JSX.Element;
}

const _MulticallTokensWhitelistTable = "MulticallTokensWhitelistTable";

export const MulticallTokensWhitelistTable = ({
    additionalItems,
    className,
    daoContractAddress,
    toolbarContent,
}: MulticallTokensWhitelistTableProps) => {
    const { data, error, loading } = MulticallTokensModel.useWhitelist(daoContractAddress);

    return (
        <Tile
            className={clsx(_MulticallTokensWhitelistTable, className)}
            heading="Tokens whitelist"
            noData={data !== null && data.length === 0}
            {...{ error, loading }}
        >
            <Scrollable>
                <Table
                    className={`${_MulticallTokensWhitelistTable}-body`}
                    displayMode="compact"
                    header={["Contract address"]}
                    rows={(data?.map(multicallWhitelistedTokenTableRow) ?? []).concat(additionalItems ?? [])}
                />
            </Scrollable>
        </Tile>
    );
};
