import clsx from "clsx";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import { Component, ContextType } from "react";

import { MulticallInstance, Wallet } from "../../entities";
import { Form, Formik } from "formik";
import { args } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Multicall } from "../../shared/lib/contracts/multicall";
import { ProposalOutput } from "../../shared/lib/contracts/sputnik-dao";
import { SputnikDAO, SputnikUI } from "../../shared/lib/contracts/sputnik-dao";
import { Big, toGas, toYocto } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { signAndSendTxs } from "../../shared/lib/wallet";
import { Tabs } from "../../shared/ui/design";
import { TextField } from "../../shared/ui/form";

import { DaoSettingsTab } from "./settings/settings";
import { DaoFundsTab } from "./funds/funds";
import { DaoJobsTab } from "./jobs/jobs";
import "./dao.scss";

const Ctx = Wallet.trySelectorContext();

interface Props {}

interface State {
    formData: {
        addr: string;
    };
    dao: SputnikDAO;
    multicallInstance: Multicall;
    loading: boolean;
    proposed: number;
    proposedInfo: ProposalOutput | null;
}

const _DaoPage = "DaoPage";

export class DaoPage extends Component<Props, State> {
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
            formData: {
                addr,
            },

            dao: new SputnikDAO(addr),
            multicallInstance: new Multicall(Multicall.getInstanceAddress(addr)),
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
        this.setState(
            {
                formData: {
                    ...this.state.formData,
                    ...newFormData,
                },
            },
            callback
        );
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

        // get last 100 DAO proposals
        const proposals = await dao.getProposals({
            from_index: lastProposalId < 100 ? 0 : lastProposalId - 100,
            limit: 100,
        });
        // Look for active "Create multicall" proposals
        const activeProposals = proposals.filter(
            (proposal) =>
                // discard if not active proposal to create multicall instance

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
            this.setState({
                multicallInstance: new Multicall(Multicall.getInstanceAddress(e.detail.dao)),
            });
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

        const multicallAddress = Multicall.getInstanceAddress(formData.addr);

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
                description: `create multicall instance for this DAO at ${multicallAddress}`,
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

        const multicallAddress = Multicall.getInstanceAddress(addr);

        this.setState({ loading: true });

        // initialize DAO object
        SputnikDAO.init(addr)
            .catch((e) => new SputnikDAO(addr))
            .then((newDao) => {
                // some error happened during DAO object init.
                if (!newDao.ready) {
                    this.setState({
                        dao: newDao,
                        multicallInstance: new Multicall(multicallAddress),
                        loading: false,
                    });
                    return;
                } else {
                    this.proposalAlreadyExists(newDao)
                        .catch((e) => {})
                        .then((proposalData) =>
                            this.setState({
                                dao: newDao,
                                multicallInstance: new Multicall(multicallAddress),
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

        const multicallAddress = Multicall.getInstanceAddress(daoAddress);

        this.setState({ loading: true });

        Promise.all([
            SputnikDAO.init(daoAddress).catch((e) => new SputnikDAO(daoAddress)),
            Multicall.init(multicallAddress).catch((e) => new Multicall(multicallAddress)),
        ]).then(([newDao, multicallInstance]) => {
            // some error happened during DAO object init.
            if (!newDao.ready || !multicallInstance.ready) {
                this.setState({
                    dao: newDao,
                    multicallInstance,
                    loading: false,
                });
            } else {
                this.proposalAlreadyExists(newDao)
                    .catch((e) => {})
                    .then((proposalData) =>
                        this.setState({
                            dao: newDao,
                            multicallInstance,
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
        const { dao, multicallInstance } = this.state;

        // if user not logged in, remind them to sign in.
        // TODO: only require signIn when DAO has no multicall instance (to know if user can propose or vote on existing proposal to create multicall)
        if (!walletSelector.isSignedIn()) {
            return (
                <div className={_DaoPage}>
                    <div className={clsx(`${_DaoPage}-content`, "error")}>Please sign in to continue</div>
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
                <div className={_DaoPage}>
                    <div className={clsx(`${_DaoPage}-content`, "error")}>
                        <div>{displayErrors}</div>
                        {this.createMulticall()}
                    </div>
                </div>
            );

        /*
         * Everything should be loaded
         */
        if (!multicallInstance.admins || !multicallInstance.tokensWhitelist || !multicallInstance.jobBond) {
            console.error("Unexpected error! Multicall might be outdated.");
        }

        return (
            <MulticallInstance.ContextProvider daoAddress={this.state.dao.address}>
                <div className={_DaoPage}>
                    <div className={`${_DaoPage}-header`}>
                        <div className="DaoSearch">
                            <Formik
                                initialValues={{ addr: STORAGE.addresses.dao ?? "" }}
                                validate={(values) => {
                                    this.setFormData({ addr: values.addr });
                                    this.tryLoadInfoDebounced();
                                }}
                                onSubmit={() => {}}
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
                            root: `${_DaoPage}-tabs`,
                            buttonsPanel: `${_DaoPage}-tabs-buttonsPanel`,
                            contentSpace: `${_DaoPage}-tabs-contentSpace`,
                        }}
                        items={[
                            DaoSettingsTab.render({ className: `${_DaoPage}-content`, adapters: { dao } }),
                            DaoFundsTab.render({ accountId: dao.address, className: `${_DaoPage}-content` }),
                            DaoJobsTab.render({ className: `${_DaoPage}-content`, adapters: { multicallInstance } }),
                        ]}
                    />
                </div>
            </MulticallInstance.ContextProvider>
        );
    }
}
