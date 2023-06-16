import clsx from "clsx";
import { ComponentProps, HTMLProps } from "react";

import { Proposal } from "../../../entities";

import "./proposals.scss";

interface DaoProposalsTabUIProps extends HTMLProps<HTMLDivElement>, ComponentProps<typeof Proposal.ProposalList> {}

const _DaoProposalsTab = "DaoProposalsTab";

const DaoProposalsTabUI = ({ className, dao, ...props }: DaoProposalsTabUIProps) => (
    <div
        className={clsx(_DaoProposalsTab, className)}
        {...props}
    >
        <Proposal.ProposalList {...{ dao }} />
    </div>
);

export const DaoProposalsTab = {
    uiConnect: (props: DaoProposalsTabUIProps) => ({
        content: <DaoProposalsTabUI {...props} />,
        lazy: true,
        name: "Proposals",
    }),
};
