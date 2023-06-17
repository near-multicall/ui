import { Chip } from "@mui/material";
import { Base64 } from "js-base64";
import {
    FunctionCallAction,
    ProposalKind,
    ProposalOutput,
    ProposalStatus,
} from "../../../shared/lib/contracts/sputnik-dao";
import { Big, toNEAR } from "../../../shared/lib/converter";
import { NearLink } from "../../../shared/ui/design";
import { ModuleContext } from "../context";
import { translateProposalKind, translateProposalStatus } from "../proposal.translate";
import "./function-call.scss";
import { Tx, signAndSendTxs } from "../../../shared/lib/wallet";

interface FunctionCallActionWithEncodedArgs extends Omit<FunctionCallAction, "args"> {
    args: string;
}

interface ProposalProps {
    data: ProposalOutput;
    approve: (id: number) => Promise<Tx>;
    reject: (id: number) => Promise<Tx>;
}

export const FunctionCallProposal = ({ data, approve, reject }: ProposalProps) => {
    const totalDeposit: Big = data.kind.FunctionCall.actions.reduce(
        (acc: Big, a: FunctionCallAction) => (acc = acc.add(new Big(a.deposit))),
        new Big(0)
    );

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
                {data.kind.FunctionCall.actions.map((a: FunctionCallActionWithEncodedArgs) => (
                    <>
                        <p className="method">
                            <span>Calling</span>
                            <span className="code">{a.method_name}</span>
                            <span>on</span>
                            <NearLink address={data.kind.FunctionCall.receiver_id} />
                        </p>
                        <pre className="args">{JSON.stringify(JSON.parse(Base64.decode(a.args)), null, 2)}</pre>
                    </>
                ))}
                <p className="attachment">
                    {totalDeposit.gt(new Big(ModuleContext.DISPLAY_YOCTO_THRESHOLD)) ? (
                        <>
                            <span className="code">{toNEAR(totalDeposit.toFixed())}</span>
                            <span>NEAR</span>
                        </>
                    ) : (
                        <>
                            <span className="code">{totalDeposit.toFixed()}</span>
                            <span>yocto</span>
                        </>
                    )}
                </p>
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
