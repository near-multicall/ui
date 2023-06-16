import { Chip } from "@mui/material";
import { ProposalKind, ProposalOutput, ProposalStatus } from "../../../shared/lib/contracts/sputnik-dao";
import { Tx, signAndSendTxs } from "../../../shared/lib/wallet";
import { translateProposalKind, translateProposalStatus } from "../proposal.translate";
import "./default.scss";
import { NearLink } from "../../../shared/ui/design";

interface ProposalProps {
    data: ProposalOutput;
    approve: (id: number) => Promise<Tx>;
    reject: (id: number) => Promise<Tx>;
}

export const DefaultProposal = ({ data, approve, reject }: ProposalProps) => (
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
            <div className="proposer">
                <NearLink address={data.proposer} />
            </div>
            <div className="description">{data.description}</div>
        </div>
        {data.status === ProposalStatus.InProgress && (
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
        )}
    </div>
);
