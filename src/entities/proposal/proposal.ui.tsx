import clsx from "clsx";
import { MouseEvent, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import { Big, toTGas } from "../../shared/lib/converter";
import { DataInspector, IconLabel, NearLink, Scrollable, Table, Tile } from "../../shared/ui/design";
import { ProposalKind, ProposalOutput, ProposalStatus, SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";

import "./proposal.ui.scss";
import { ModuleContext } from "./context";
import { Chip, Pagination } from "@mui/material";
import { FunctionCallProposal } from "./proposal-kinds/function-call";
import { DefaultProposal } from "./proposal-kinds/default";
import { Tx } from "../../shared/lib/wallet";
import { TransferProposal } from "./proposal-kinds/transfer";

type FetchState<T> = {
    data: T | null;
    error: Error | null;
    loading: boolean;
};

interface ProposalListProps {
    className?: string;
    dao: SputnikDAO;
}

interface ProposalProps {
    data: ProposalOutput;
    approve: (id: number) => Promise<Tx>;
    reject: (id: number) => Promise<Tx>;
}

const Proposal = (props: ProposalProps) => {
    switch (Object.keys(props.data.kind)[0]) {
        case "FunctionCall":
            return <FunctionCallProposal {...props} />;
        case "Transfer":
            return <TransferProposal {...props} />;
        default:
            return <DefaultProposal {...props} />;
    }
};

export const ProposalList = ({ className, dao }: ProposalListProps) => {
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [paginationOffset, setPaginationOffset] = useState<number>(1);
    const [pageCount, setPageCount] = useState<number>(1);
    const [proposals, setProposals] = useState<FetchState<ProposalOutput[]>>({
        data: null,
        error: null,
        loading: true,
    });

    useEffect(() => {
        const interval = setInterval(() => setLastUpdated(new Date()), ModuleContext.PROPOSAL_UPDATE_FREQ);
        return () => clearInterval(interval);
    });

    // refresh proposal list if dao or pagination offset has changed
    const fetchProposals = useMemo(
        () =>
            dao.getLastProposalId().then((lastId) => {
                setPageCount(Math.ceil(lastId / ModuleContext.PROPOSALS_PER_PAGE));
                return dao
                    .getProposals({
                        from_index: Math.max(lastId - paginationOffset * ModuleContext.PROPOSALS_PER_PAGE, 0),
                        limit: ModuleContext.PROPOSALS_PER_PAGE,
                    })
                    .then((data) => ({
                        data: data.reverse(),
                        error: null,
                        loading: false,
                    }))
                    .catch((error) => ({
                        data: null,
                        error,
                        loading: false,
                    }));
            }),
        [dao, paginationOffset]
    );

    fetchProposals.then(setProposals);

    const { data, error, loading } = proposals;

    return (
        <Tile
            classes={{ root: clsx("ProposalList", className) }}
            heading="DAO Proposals"
            noData={data !== null && Object.values(data).length === 0}
            headerSlots={{
                end: (
                    <div className="auto-refresh">
                        <div />
                    </div>
                ),
            }}
            footer={
                <Pagination
                    className="pagination"
                    count={pageCount}
                    page={paginationOffset}
                    onChange={(e, value) => setPaginationOffset(value)}
                />
            }
            {...{ error, loading }}
        >
            {!!data && (
                <Scrollable className="content">
                    {data!.map((p) => (
                        <Proposal
                            data={p}
                            approve={(id) => dao.actProposal(id, "VoteApprove")}
                            reject={(id) => dao.actProposal(id, "VoteReject")}
                            key={p.id}
                        />
                    ))}
                </Scrollable>
            )}
        </Tile>
    );
};
