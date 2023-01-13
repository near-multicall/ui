import clsx from "clsx";
import { Form, Formik } from "formik";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import { Component, ContextType } from "react";

import { MulticallInstance, Wallet } from "../../entities";
import { args } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Multicall } from "../../shared/lib/contracts/multicall";
import { ProposalOutput } from "../../shared/lib/contracts/sputnik-dao";
import { SputnikDAO, SputnikUI } from "../../shared/lib/contracts/sputnik-dao";
import { Big, toGas } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { signAndSendTxs } from "../../shared/lib/wallet";
import { Tabs } from "../../shared/ui/design";
import { TextField } from "../../shared/ui/form";
import { ScheduleOverview, FundsOverview, SettingsManager } from "../../widgets";

import "./dao-page.ui.scss";

const Ctx = Wallet.trySelectorContext();

interface Props {}

interface State {
    formData: { addr: string };
    dao: SputnikDAO;
    loading: boolean;
    proposed: number;
    proposedInfo: ProposalOutput | null;
}

export const _DAOPage = "DAOPage";

export class DAOPage extends Component<Props, State> {
    static contextType = Ctx;
    declare context: ContextType<typeof Ctx>;

    schema = args
        .object()
        .shape({
            addr: args
                .object()
                .shape({
                    noAddress: args.string().address().retain({ initial: true }),
                    noDao: args.string().sputnikDao().retain({ initial: true }),
                    noMulticall: args.string().multicall().retain({
                        customMessage: "DAO does not have a multicall instance",
                        initial: true,
                    }),
                })
                .transform((_, addr) => ({
                    noAddress: addr,
                    noDao: addr,
                    noMulticall: Multicall.getInstanceAddress(addr),
                }))
                .retain(),
        })
        .retain();

    tryLoadInfoDebounced = debounce(() => this.tryLoadInfo(), 400);

    lastAddr: string | null;
    fee: string = "";
    formikSetValues?: (fields: State["formData"], shouldValidate?: boolean) => void;

    constructor(props: Props) {
        super(props);

        const addr = STORAGE.addresses.dao;

        this.state = {
            formData: { addr },
            dao: new SputnikDAO(addr),
            loading: false,
            proposed: -1,
            proposedInfo: null,
        };

        this.schema.check(this.state.formData);

        Multicall.getFactoryFee().then((multicallFactoryFee) => {
            this.fee = multicallFactoryFee;
            this.tryLoadInfo();
        });

        this.lastAddr = null;
    }

    setFormData(newFormData: State["formData"], callback?: () => void | undefined) {
        this.setState({ formData: { ...this.state.formData, ...newFormData } }, callback);
    }

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

        const last100Proposals = await dao.getProposals({
            from_index: lastProposalId < 100 ? 0 : lastProposalId - 100,
            limit: 100,
        });

        // Look for active "Create multicall" proposals
        const activeProposals = last100Proposals.filter(
            /**
             * Discard if not active proposal to create multicall instance
             */
            (proposal) =>
                proposal.kind?.FunctionCall?.receiver_id === Multicall.FACTORY_ADDRESS &&
                proposal.kind?.FunctionCall?.actions?.[0]?.method_name === "create" &&
                proposal.status === "InProgress" &&
                Big(proposal.submission_time).add(proposalPeriod).gt(currentTime)
        );

        // If there many "Create multicall" proposals, return latest.
        if (activeProposals.length > 0) {
            const lastProposal = activeProposals.pop()!;
            return { proposal_id: lastProposal.id, proposal_info: lastProposal };
        }
        // No "Create multicall" proposals found.
        else return { proposal_id: -1, proposal_info: null };
    }

    onAddressesUpdated(e: CustomEvent<{ dao: string }>) {
        if (e.detail.dao !== this.state.formData.addr) {
            this.formikSetValues?.({ addr: e.detail.dao });
        }
    }

    createMulticall() {
        const { accountId } = this.context!;
        const { loading, dao, proposed, proposedInfo, formData } = this.state;
        const { noMulticall, noDao } = fields(this.schema, "addr");

        if (
            this.fee === "" ||
            // wallet not logged in or DAO object not initialized yet
            dao?.ready !== true
        ) {
            return null;
        }

        const depo = Big(this.fee).plus(MulticallInstance.MIN_BALANCE);

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
                description: `create multicall instance for this DAO at ${Multicall.getInstanceAddress(formData.addr)}`,
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
            noMulticall.isBad() &&
            !noDao.isBad() && // base.sputnik-dao.near does not exist
            !loading &&
            // disappear while debouncing
            this.lastAddr === formData.addr
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
                            {"This DAO has no multicall instance. "}
                            {"A DAO member with proposal creation permission should make a proposal."}
                        </div>
                    );
                }
            } else if (proposed !== -1) {
                // create multicall proposal exists

                if (!canApprove) {
                    // user does not have rights to VoteApprove

                    return (
                        <div className="Alert">
                            {"Proposal to create a multicall exists (#${proposed}),"}
                            {" but you have no voting permissions on this DAO."}
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
                            {"You have voted on creating a multicall instance for this DAO. "}
                            {"It will be created as soon as the proposal passes voting."}
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

    tryLoadInfo() {
        if (this.lastAddr === this.state.formData.addr) return;
        this.lastAddr = this.state.formData.addr;
        this.schema.check(this.state.formData).then(() => {
            const { noDao } = fields(this.schema, "addr");
            if (!this.schema.isBad()) {
                // case 0: DAO and Multicall exist
                this.confidentlyLoadInfo();
            } else if (!noDao.isBad()) {
                // case 1: Only DAO exists
                this.confidentlyLoadOnlyDaoInfo();
            } else {
                // case 2: neither exist
                this.setState({
                    proposed: -1,
                    proposedInfo: null,
                    dao: new SputnikDAO(this.state.formData.addr), // will be invalid
                });
            }
        });
    }

    confidentlyLoadOnlyDaoInfo() {
        const { addr } = this.state.formData;

        this.setState({ loading: true });

        // initialize DAO object
        SputnikDAO.init(addr)
            .catch((e) => new SputnikDAO(addr))
            .then((dao) => {
                // some error happened during DAO object init.
                if (!dao.ready) {
                    this.setState({ dao, loading: false });
                    return;
                } else {
                    this.proposalAlreadyExists(dao)
                        .catch((e) => {})
                        .then((proposalData) =>
                            this.setState({
                                dao,
                                loading: false,
                                proposed: proposalData?.proposal_id ?? -1,
                                proposedInfo: (proposalData?.proposal_info as ProposalOutput) ?? null,
                            })
                        );
                }
            });
    }

    confidentlyLoadInfo() {
        const { addr: daoAddress } = this.state.formData;

        this.setState({ loading: true });

        SputnikDAO.init(daoAddress)
            .catch((e) => new SputnikDAO(daoAddress))
            .then((dao) => {
                // some error happened during DAO object init.
                if (!dao.ready) {
                    this.setState({ dao, loading: false });
                } else {
                    this.proposalAlreadyExists(dao)
                        .catch((e) => {})
                        .then((proposalData) =>
                            this.setState({
                                dao,
                                loading: false,
                                proposed: proposalData?.proposal_id ?? -1,
                                proposedInfo: (proposalData?.proposal_info as ProposalOutput) ?? null,
                            })
                        );
                }
            });
    }

    componentDidMount(): void {
        window.SIDEBAR.switchPage("dao");
        document.addEventListener("onaddressesupdated", (event) => this.onAddressesUpdated(event as CustomEvent));
    }

    render() {
        const { selector: walletSelector } = this.context!;

        // if user not logged in, remind them to sign in.
        // TODO: only require signIn when DAO has no multicall instance (to know if user can propose or vote on existing proposal to create multicall)
        if (!walletSelector.isSignedIn()) {
            return (
                <div className={_DAOPage}>
                    <div className={clsx(`${_DAOPage}-content`, "error")}>Please sign in to continue</div>
                </div>
            );
        }

        const displayErrorsList = ["noAddress", "noDao", "noMulticall"];

        const displayErrors = Object.entries(fields(this.schema, "addr"))
            .filter(([k, v]) => v.isBad() && displayErrorsList.includes(k))
            .map(([k, v]) => (
                <p
                    key={`p-${k}`}
                    className={"red"}
                >
                    <span>{v.isBad() ? "\u2717" : "\u2714"} </span>
                    {v.message()}
                </p>
            ));

        if (displayErrors.length > 0)
            return (
                <div className={_DAOPage}>
                    <div className={clsx(`${_DAOPage}-content`, "error")}>
                        <div>{displayErrors}</div>
                        {this.createMulticall()}
                    </div>
                </div>
            );

        return (
            <div className={_DAOPage}>
                <div className={`${_DAOPage}-header`}>
                    <div className="DaoSearch">
                        <Formik
                            initialValues={{ addr: STORAGE.addresses.dao ?? "" }}
                            validate={({ addr }) => {
                                void this.setFormData({ addr });
                                void this.tryLoadInfoDebounced();
                            }}
                            onSubmit={() => void null}
                        >
                            {({ setValues }) => {
                                this.formikSetValues = setValues;

                                return (
                                    <Form>
                                        <TextField
                                            name="addr"
                                            placeholder="Search for DAOs"
                                            hiddenLabel={true}
                                            variant="standard"
                                            autoFocus
                                        />
                                    </Form>
                                );
                            }}
                        </Formik>
                    </div>
                </div>

                <Tabs
                    classes={{
                        root: `${_DAOPage}-tabs`,
                        buttonsPanel: `${_DAOPage}-tabs-buttonsPanel`,
                        contentSpace: `${_DAOPage}-tabs-contentSpace`,
                    }}
                    items={[
                        {
                            name: "Settings",
                            ui: (
                                <SettingsManager
                                    accountId={this.state.dao.address}
                                    dao={this.state.dao}
                                    className={`${_DAOPage}-content`}
                                />
                            ),
                        },

                        {
                            lazy: true,
                            name: "Funds",
                            ui: (
                                <FundsOverview
                                    accountId={this.state.dao.address}
                                    accountName="DAO"
                                    className={`${_DAOPage}-content`}
                                />
                            ),
                        },

                        {
                            lazy: true,
                            name: "Jobs",
                            ui: (
                                <ScheduleOverview
                                    accountId={this.state.dao.address}
                                    className={`${_DAOPage}-content`}
                                />
                            ),
                        },
                    ]}
                />
            </div>
        );
    }
}