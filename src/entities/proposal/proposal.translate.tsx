import { ProposalKind, ProposalStatus } from "../../shared/lib/contracts/sputnik-dao";

export const translateProposalStatus: Record<ProposalStatus, string> = {
    InProgress: "🟢 In progress",
    Approved: "🟢 Approved",
    Rejected: "🔴 Rejected",
    Removed: "🔴 Removed",
    Expired: "🔴 Expired",
    Moved: "🔴 Moved",
    Failed: "🔴 Failed",
};

export const translateProposalKind: Record<ProposalKind, string> = {
    ChangeConfig: "Change config",
    ChangePolicy: "Change policy",
    AddMemberToRole: "Add member to role",
    RemoveMemberFromRole: "Remove member from role",
    FunctionCall: "Function call",
    UpgradeSelf: "Upgrade self",
    UpgradeRemote: "Update remote",
    Transfer: "Transfer",
    SetStakingContract: "Set staking contract",
    AddBounty: "Add bounty",
    BountyDone: "Bounty done",
    Vote: "Vote",
    FactoryInfoUpdate: "Factory info update",
    ChangePolicyAddOrUpdateRole: "Change policy add or update role",
    ChangePolicyRemoveRole: "Change policy remove role",
    ChangePolicyUpdateDefaultVotePolicy: "Change policy update default vote policy",
    ChangePolicyUpdateParameters: "Change policy update parameters",
};
