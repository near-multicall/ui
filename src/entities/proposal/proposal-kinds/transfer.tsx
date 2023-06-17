import { Chip } from "@mui/material";
import { useEffect, useState } from "react";
import { args } from "../../../shared/lib/args/args";
import { ProposalKind, ProposalOutput, ProposalStatus } from "../../../shared/lib/contracts/sputnik-dao";
import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";
import { Tx, signAndSendTxs } from "../../../shared/lib/wallet";
import { IconLabel, NearIcon, NearLink } from "../../../shared/ui/design";
import { translateProposalKind, translateProposalStatus } from "../proposal.translate";
import "./transfer.scss";

interface ProposalProps {
    data: ProposalOutput;
    approve: (id: number) => Promise<Tx>;
    reject: (id: number) => Promise<Tx>;
}

export const TransferProposal = ({ data, approve, reject }: ProposalProps) => {
    const [ft, setFt] = useState<FungibleToken>(new FungibleToken(data.kind.Transfer.amount));

    useEffect(() => void FungibleToken.init(data.kind.Transfer.token_id).then((ft) => setFt(ft)), []);

    return (
        <div className="Proposal">
            <div className="header">
                <h1 className="id">{`#${data.id}`}</h1>
                <Chip
                    className="kind"
                    label={translateProposalKind[Object.keys(data.kind)[0] as ProposalKind]}
                    size="small"
                />
                <Chip
                    className="status"
                    label={translateProposalStatus[data.status]}
                    size="small"
                />
                <span className="submission-time">
                    {new Date(parseInt(data.submission_time.slice(0, -6))).toLocaleString()}
                </span>
            </div>
            <div className="body">
                <div className="description">{data.description}</div>
                <div className="proposer">
                    <NearLink address={data.proposer} />
                </div>
                {ft.ready && (
                    <div className="transfer">
                        <IconLabel
                            icon={ft.metadata.icon ?? <NearIcon.GenericTokenFilled />}
                            label={`${args
                                .big()
                                .intoFormatted(ft.metadata.decimals)
                                .cast(data.kind.Transfer.amount)
                                .toFixed()} ${ft.metadata.symbol}`}
                            reversed
                        />
                        <span className="to">to</span>
                        <NearLink address={data.kind.Transfer.receiver_id} />
                    </div>
                )}
            </div>
            {data.status === ProposalStatus.InProgress && (
                <div className="footer">
                    <div className="footer">
                        <button
                            className="approve"
                            onClick={() => approve(data.id).then((tx) => signAndSendTxs([tx]))}
                        >
                            Approve
                        </button>
                        <button
                            className="reject"
                            onClick={() => reject(data.id).then((tx) => signAndSendTxs([tx]))}
                        >
                            Reject
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
