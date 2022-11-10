import { InputAdornment } from "@mui/material";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import { Component, ContextType } from "react";

import { MulticallInstance, Wallet } from "../../entities";
import { signAndSendTxs } from "../../shared/lib/wallet";
import { ArgsAccount, ArgsError } from "../../shared/lib/args";
import { SputnikDAO, SputnikUI, ProposalStatus } from "../../shared/lib/contracts/sputnik-dao";
import { Multicall } from "../../shared/lib/contracts/multicall";
import { toYocto, Big, toGas } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import type { ProposalOutput } from "../../shared/lib/contracts/sputnik-dao";
import { Tabs, TextInput } from "../../shared/ui/components";

import { DaoFundsTab } from "./funds/funds";
import { DaoJobsTab } from "./jobs/jobs";
import { DaoConfigTab } from "./config/config";
import "./dao.scss";

const Ctx = Wallet.trySelectorContext();

interface Props {}

interface State {
    name: ArgsAccount;
    dao: SputnikDAO;
    multicall: Multicall;
    loading: boolean;
    proposed: number;
    proposedInfo: ProposalOutput | null;
}

const _DaoPage = "DaoPage";

export class DaoPage extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        // split DAO address into parent address and rest (name).
        const deconstructedDaoAddress = ArgsAccount.deconstructAddress(STORAGE.addresses.dao);

        this.state = {
            name: new ArgsAccount(deconstructedDaoAddress.name),
            dao: new SputnikDAO(STORAGE.addresses.dao),
            multicall: new Multicall(`${deconstructedDaoAddress.name}.${Multicall.FACTORY_ADDRESS}`),
            loading: false,
            proposed: -1,
            proposedInfo: null,
        };

        this.fee = "";
        this.lastAddr = "";

        Multicall.getFactoryFee().then((multicallFactoryFee) => {
            this.fee = multicallFactoryFee;
            this.loadInfo();
        });
    }

    static contextType = Ctx;
    declare context: ContextType<typeof Ctx>;

    lastAddr: string = "";
    // Multicall factory fee.
    fee: string = "";

    errors: { [key: string]: ArgsError } = {
        address: new ArgsError(
            "Invalid NEAR address",
            (input) => ArgsAccount.isValid(`${input.value}.${SputnikDAO.FACTORY_ADDRESS}`),
            !ArgsAccount.isValid(STORAGE.addresses.dao)
        ),
        noDao: new ArgsError("Sputnik DAO not found on given address", (value) => this.errors.noDao.isBad),
        noContract: new ArgsError("DAO has no multicall instance", (value) => this.errors.noContract.isBad),
    };

    loadInfoDebounced = debounce(() => this.loadInfo(), 400);

    /**
     * check if DAO has a proposal to create multicall instance.
     * proposal must be in progress, and not expired.
     *
     * @returns {object} ID and info of proposal to create multicall instance,
     */
    async proposalAlreadyExists(
        dao: SputnikDAO
    ): Promise<{ proposal_id: number; proposal_info: ProposalOutput | null }> {
        // Date.now() returns timestamp in milliseconds, SputnikDAO uses nanoseconds
        const currentTime = Big(Date.now()).times("1000000");
        const lastProposalId = dao.lastProposalId;
        const proposalPeriod = dao.policy.proposal_period;

        // get last 100 DAO proposals
        const proposals = await dao.getProposals({
            from_index: lastProposalId < 100 ? 0 : lastProposalId - 100,
            limit: 100,
        });
        // Look for active "Create multicall" proposals
        const activeProposals = proposals.filter((proposal) => {
            // discard if not active proposal to create multicall instance
            if (
                !(proposal.kind?.FunctionCall?.receiver_id === Multicall.FACTORY_ADDRESS) ||
                !(proposal.kind?.FunctionCall?.actions?.[0]?.method_name === "create") ||
                !(proposal.status === ProposalStatus.InProgress)
            ) {
                return false;
            }
            // calculate proposal expiration timestamp in nanoseconds
            const expirationTime = Big(proposal.submission_time).add(proposalPeriod);
            // check if proposal expired
            return expirationTime.gt(currentTime) ? true : false;
        });

        // If there many "Create multicall" proposals, return latest.
        if (activeProposals.length > 0) {
            const lastProposal = activeProposals.pop()!;
            return { proposal_id: lastProposal.id, proposal_info: lastProposal };
        }
        // No "Create multicall" proposals found.
        else return { proposal_id: -1, proposal_info: null };
    }

    createMulticall() {
        const { accountId } = this.context!;
        const { loading, dao, proposed, proposedInfo } = this.state;
        const { noContract, noDao } = this.errors;

        if (
            this.fee === "" ||
            // wallet not logged in or DAO object not initialized yet
            dao?.ready !== true
        ) {
            return null;
        }

        const depo = Big(this.fee).plus(MulticallInstance.MIN_BALANCE);
        const daoSearchInput: HTMLInputElement = document.querySelector(".DaoSearch input")!;

        /**
         * Can user propose a FunctionCall to DAO?
         */
        const canPropose = dao.checkUserPermission(accountId!, "AddProposal", "FunctionCall");

        /**
         * Can user vote approve a FunctionCall on the DAO?
         */
        const canApprove = dao.checkUserPermission(accountId!, "VoteApprove", "FunctionCall");

        const args = {
            proposal: {
                description: `create multicall instance for this DAO at ${this.state.multicall.address}`,

                kind: {
                    FunctionCall: {
                        receiver_id: Multicall.FACTORY_ADDRESS,

                        actions: [
                            {
                                method_name: "create",
                                args: Base64.encode(
                                    JSON.stringify({
                                        multicall_init_args: {
                                            admin_accounts: [dao.address],
                                            croncat_manager: window.nearConfig.CRONCAT_MANAGER_ADDRESS,
                                            job_bond: dao.policy.proposal_bond,
                                        },

                                        public_key: "HdJuXFRBKMEXuzEsXVscdd3aoBvEGGXDKQ3JoNhqJ4uU",
                                    })
                                ),

                                deposit: depo.toFixed(),
                                gas: toGas("150"),
                            },
                        ],
                    },
                },
            },
        };

        if (
            noContract.isBad &&
            // base.sputnik-dao.near does not exist
            !noDao.isBad &&
            !loading &&
            // disappear while debouncing
            this.lastAddr === daoSearchInput.value
        ) {
            if (proposed === -1) {
                // no create multicall proposal exists

                if (canPropose) {
                    // ... and user can propose FunctionCall

                    return (
                        <>
                            <div className="Alert">
                                {/* hint: you can use "genesis" or "test" as DAO to get to this message */}
                                {`A multicall instance can only be created for `}

                                <a
                                    href={dao.getDaoUrl(SputnikUI.ASTRO_UI)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {dao.address}
                                </a>

                                {` by making a proposal.`}
                            </div>

                            <button
                                className="create-multicall"
                                onClick={() => {
                                    dao.addProposal(args).then((tx) => signAndSendTxs([tx]));
                                }}
                            >
                                Propose
                            </button>
                        </>
                    );
                } else {
                    // ... and user cannot propose FunctionCall

                    return (
                        <div className="Alert">
                            {/* hint: you can use "ref-community-board-testnet" as DAO to get to this message */}
                            {`This DAO has no multicall instance. A DAO member with proposing permissions should make a proposal.`}
                        </div>
                    );
                }
            } else if (proposed !== -1) {
                // create multicall proposal exists

                if (!canApprove) {
                    // user does not have rights to VoteApprove

                    return (
                        <div className="Alert">
                            {`Proposal to create a multicall exists (#${proposed}), but you have no voting permissions on this DAO.`}
                            <br />
                            <a
                                target="_blank"
                                href={dao.getProposalUrl(SputnikUI.ASTRO_UI, proposed)}
                                rel="noopener noreferrer"
                            >
                                Proposal on Astro
                            </a>
                        </div>
                    );
                } else if (proposedInfo?.votes[accountId!]) {
                    // user can VoteApprove and already voted

                    return (
                        <div className="Alert">
                            {`You have voted on creating a multicall instance for this DAO. It will be created as soon as the proposal passes voting.`}
                            <br />
                            <a
                                target="_blank"
                                href={dao.getProposalUrl(SputnikUI.ASTRO_UI, proposed)}
                                rel="noopener noreferrer"
                            >
                                Proposal on Astro
                            </a>
                        </div>
                    );
                } else {
                    // user can VoteApprove and did NOT vote yet.

                    return (
                        <>
                            <div className="Alert">
                                {/* hint: you can use "genesis" or "test" as DAO to get to this message */}
                                {`There exists a proposal (#${proposed}) to create a multicall instance for this DAO. `}

                                <a
                                    href={dao.getProposalUrl(SputnikUI.ASTRO_UI, proposed)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open on AstroDAO
                                </a>
                            </div>

                            <button
                                className="create-multicall proposal-exists"
                                onClick={() => {
                                    dao.actProposal(proposed, "VoteApprove").then((tx) => signAndSendTxs([tx]));
                                }}
                            >
                                {`vote YES`}
                            </button>
                        </>
                    );
                }
            }
        }
    }

    loadInfo() {
        const { address, noContract, noDao } = this.errors;
        const { name } = this.state;

        const multicallAddress = `${name.value}.${Multicall.FACTORY_ADDRESS}`;
        const daoAddress = `${name.value}.${SputnikDAO.FACTORY_ADDRESS}`;

        if (this.lastAddr === name.value) return;

        this.lastAddr = name.value;
        noContract.isBad = false;
        noDao.isBad = false;

        if (address.isBad) {
            /*
             * Chosen address violates NEAR AccountId rules.
             */
            noContract.isBad = true;
            noDao.isBad = true;

            this.setState({ proposed: -1, proposedInfo: null });

            return;
        }

        this.setState({ loading: true });

        /*
         * Initialize DAO and multicall objects
         */
        Promise.all([
            SputnikDAO.init(daoAddress).catch((e) => new SputnikDAO(daoAddress)),
            Multicall.init(multicallAddress).catch((e) => new Multicall(multicallAddress)),
        ]).then(([dao, multicall]) => {
            if (!dao.ready || !multicall.ready) {
                /*
                 * DAO or multicall not ready => either no contract on the chosen address
                 * or some error happened during object initialization.
                 */
                noContract.isBad = !multicall.ready;
                noDao.isBad = !dao.ready;

                this.setState({ dao, multicall, loading: false });

                return;
            } else {
                /*
                 * DAO correctly initialized, try to fetch multicall info
                 */
                Promise.all([this.proposalAlreadyExists(dao).catch(console.error)]).then(([proposalData]) =>
                    this.setState(({ proposed }) => ({
                        dao,
                        multicall,
                        loading: false,
                        proposed: proposalData?.proposal_id || proposed,
                        proposedInfo: proposalData?.proposal_info || null,
                    }))
                );
            }
        });
    }

    getContent() {
        const { selector: walletSelector } = this.context!;
        const { dao, loading, multicall } = this.state;

        // TODO: only require signIn when DAO has no multicall instance (to know if user can propose or vote on existing proposal to create multicall)
        if (!walletSelector.isSignedIn()) {
            return <div className="DaoPage-content error">Please sign in to continue</div>;
        }

        const displayErrorsList = ["address", "noDao", "noContract"];

        const displayErrors = Object.keys(this.errors)
            .filter((e) => this.errors[e].isBad && displayErrorsList.includes(e))
            .map((e) => (
                <p
                    key={`p-${e}`}
                    className={"red"}
                >
                    <span>{this.errors[e].isBad ? "\u2717" : "\u2714"} </span>
                    {this.errors[e].message}
                </p>
            ));

        if (displayErrors.length > 0)
            return (
                <>
                    <div className="DaoPage-content error">
                        <div>{displayErrors}</div>
                        {this.createMulticall()}
                    </div>
                </>
            );

        if (loading) return <div className="DaoPage-content loader" />;

        /*
         * Everything should be loaded
         */
        if (!multicall.admins || !multicall.tokensWhitelist || !multicall.jobBond) {
            console.error("multicall infos incomplete", multicall);
            return <div className="DaoPage-content error">Unexpected error! Multicall might be outdated.</div>;
        }

        return (
            <Tabs
                classes={{ buttonsPanel: "DaoPage-tabs-buttonsPanel", contentSpace: "DaoPage-tabs-contentSpace" }}
                items={[
                    DaoConfigTab.uiConnect({ className: `${_DaoPage}-content`, contracts: { dao, multicall } }),
                    DaoFundsTab.uiConnect({ className: `${_DaoPage}-content`, contracts: { dao, multicall } }),
                    DaoJobsTab.uiConnect({ className: `${_DaoPage}-content`, contracts: { multicall } }),
                ]}
            />
        );
    }

    onAddressesUpdated() {
        const { name } = this.state;
        const daoAccount = new ArgsAccount(STORAGE.addresses.dao);

        if (!(name.value === daoAccount.deconstructAddress().name)) {
            this.setState(
                {
                    name: new ArgsAccount(daoAccount.deconstructAddress().name),
                    multicall: new Multicall(`${daoAccount.deconstructAddress().name}.${Multicall.FACTORY_ADDRESS}`),
                },

                () => {
                    this.errors.address.validOrNull(daoAccount);
                    this.loadInfo();
                }
            );
        }
    }

    componentDidMount(): void {
        window.SIDEBAR.switchPage("dao");
        document.addEventListener("onaddressesupdated", () => this.onAddressesUpdated());
    }

    render() {
        const { name } = this.state;

        return (
            <div className="DaoPage">
                <div className="DaoPage-header">
                    <div className="DaoSearch">
                        <TextInput
                            placeholder="Insert DAO name here"
                            value={name}
                            error={this.errors.address}
                            update={() => {
                                const fullDaoAddr = `${name.value}.${SputnikDAO.FACTORY_ADDRESS}`;
                                const daoAccount = new ArgsAccount(fullDaoAddr);
                                if (daoAccount.isValid()) {
                                    this.loadInfoDebounced();
                                }
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">{`.${SputnikDAO.FACTORY_ADDRESS}`}</InputAdornment>
                                ),
                            }}
                        />
                    </div>
                </div>

                {this.getContent()}
            </div>
        );
    }
}
