import { AddOutlined, DeleteOutline, EditOutlined, PauseOutlined, PlayArrowOutlined } from "@mui/icons-material";
import clsx from "clsx";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import { Component, ContextType } from "react";

import { Field, Form, Formik } from "formik";
import { Wallet } from "../../entities";
import { args } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Multicall } from "../../shared/lib/contracts/multicall";
import type { ProposalOutput } from "../../shared/lib/contracts/sputnik-dao";
import { SputnikDAO, SputnikUI } from "../../shared/lib/contracts/sputnik-dao";
import { Big, toNEAR, toYocto } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { view } from "../../shared/lib/wallet";
import { Facet, Scrollable, Tabs } from "../../shared/ui/components";
import { TokensBalances } from "../../widgets/tokens-balances";
import "./config/config.scss";
import "./funds/funds.scss";
import "./dao.scss";

// minimum balance a multicall instance needs for storage + state.
const MIN_INSTANCE_BALANCE = toYocto(1); // 1 NEAR
const Ctx = Wallet.useSelector();

interface Props {}

interface State {
    formData: {
        addr: string;
    };
    dao: SputnikDAO;
    multicall: Multicall;
    loading: boolean;
    proposed: number;
    proposedInfo: ProposalOutput | null;

    info: {
        admins: string[];
        tokens: string[];
        jobs: any[];
        jobBond: string;
    };
}
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
                    noMulticall: this.toMulticallAddress(addr),
                }))
                .retain(),
        })
        .retain();

    tryLoadInfoDebounced = debounce(() => this.tryLoadInfo(), 400);

    lastAddr: string;
    fee?: string;
    formikSetValues?: (fields: State["formData"], shouldValidate?: boolean) => void;

    constructor(props: Props) {
        super(props);

        const addr = STORAGE.addresses.dao;

        this.state = {
            formData: {
                addr,
            },

            dao: new SputnikDAO(addr),
            multicall: new Multicall(this.toMulticallAddress(addr)),

            loading: false,
            proposed: -1,
            proposedInfo: null,

            info: {
                admins: [],
                tokens: [],
                jobs: [],
                jobBond: "...",
            },
        };

        this.schema.check(this.state.formData);

        view(window.nearConfig.MULTICALL_FACTORY_ADDRESS, "get_fee", {}).then((createMulticallFee) => {
            this.fee = createMulticallFee;
            this.tryLoadInfo();
        });

        document.addEventListener("onaddressesupdated", (e) => this.onAddressesUpdated(e as CustomEvent));

        this.lastAddr = this.state.formData.addr;
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

    toMulticallAddress(addr: string): string {
        return args
            .string()
            .ensure()
            .intoBaseAddress()
            .append("." + window.nearConfig.MULTICALL_FACTORY_ADDRESS)
            .cast(addr);
    }

    /**
     * check if DAO has a proposal to create multicall instance.
     * proposal must be in progress, and not expired.
     *
     * @returns {object} ID and info of proposal to create multicall instance,
     */
    async proposalAlreadyExists(dao: SputnikDAO): Promise<{ proposal_id: number; proposal_info: object }> {
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

                proposal.kind?.FunctionCall?.receiver_id === window.nearConfig.MULTICALL_FACTORY_ADDRESS &&
                proposal.kind?.FunctionCall?.actions?.[0]?.method_name === "create" &&
                proposal.status === "InProgress"
        );

        // If there many "Create multicall" proposals, return latest.
        if (activeProposals.length > 0) {
            const lastProposal = activeProposals.pop()!;
            return { proposal_id: lastProposal.id, proposal_info: lastProposal };
        }
        // No "Create multicall" proposals found.
        else return { proposal_id: -1, proposal_info: {} };
    }

    onAddressesUpdated(e: CustomEvent<{ dao: string }>) {
        if (e.detail.dao !== this.state.formData.addr) {
            this.setState({
                multicall: new Multicall(this.toMulticallAddress(e.detail.dao)),
            });
            this.formikSetValues?.({ addr: e.detail.dao });
        }
    }

    createMulticall() {
        const { accountId } = this.context!;
        const { loading, dao, proposed, proposedInfo, formData } = this.state;
        const { noMulticall, noDao } = fields(this.schema, "addr");

        if (
            this.fee === undefined ||
            // wallet not logged in or DAO object not initialized yet
            dao?.ready !== true
        ) {
            return null;
        }

        const multicallAddress = `${formData.addr}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`;

        const depo = Big(this.fee).plus(MIN_INSTANCE_BALANCE);
        const daoSearchInput: HTMLInputElement = document.querySelector(".DaoSearch input")!;

        // can user propose a FunctionCall to DAO?
        const canPropose = dao.checkUserPermission(accountId!, "AddProposal", "FunctionCall");

        // can user vote approve a FunctionCall on the DAO?
        const canApprove = dao.checkUserPermission(accountId!, "VoteApprove", "FunctionCall");

        const args = {
            proposal: {
                description: `create multicall instance for this DAO at ${multicallAddress}`,
                kind: {
                    FunctionCall: {
                        receiver_id: window.nearConfig.MULTICALL_FACTORY_ADDRESS,

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
                                gas: "150000000000000",
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
                                    dao.addProposal(args, dao.policy.proposal_bond);
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
                                    dao.actProposal(proposed, "VoteApprove");
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

    toLink(address: string, deleteIcon = true) {
        return (
            <span>
                <a
                    href={args.string().address().intoUrl().cast(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {address}
                </a>
                {deleteIcon ? <DeleteOutline /> : null}
            </span>
        );
    }

    job(job: any) {
        return (
            <div className="JobsList-item">
                <EditOutlined />
                <DeleteOutline />
                {job.is_active ? <PauseOutlined /> : <PlayArrowOutlined />}
                <pre>{JSON.stringify(job, null, "  ")}</pre>
            </div>
        );
    }

    tryLoadInfo() {
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

        const multicallAddress = this.toMulticallAddress(addr);

        this.setState({ loading: true });

        // initialize DAO object
        SputnikDAO.init(addr)
            .catch((e) => new SputnikDAO(addr))
            .then((newDao) => {
                if (!newDao) return;
                // some error happened during DAO object init.
                if (!newDao.ready) {
                    this.setState({
                        dao: newDao,
                        multicall: new Multicall(multicallAddress),
                        loading: false,
                    });
                    return;
                } else {
                    this.proposalAlreadyExists(newDao)
                        .catch((e) => {})
                        .then((proposalData) =>
                            this.setState({
                                dao: newDao,
                                multicall: new Multicall(multicallAddress),
                                loading: false,
                                proposed: proposalData?.proposal_id || -1,
                                proposedInfo: (proposalData?.proposal_info as ProposalOutput) || null,
                            })
                        );
                }
            });
    }

    confidentlyLoadInfo() {
        const { addr } = this.state.formData;

        const multicallAddress = this.toMulticallAddress(addr);

        this.setState({ loading: true });

        // initialize DAO object
        SputnikDAO.init(addr)
            .catch((e) => new SputnikDAO(addr))
            .then((newDao) => {
                if (!newDao) return;
                // some error happened during DAO object init.
                if (!newDao.ready) {
                    this.setState({
                        dao: newDao,
                        multicall: new Multicall(multicallAddress),
                        loading: false,
                    });
                    return;
                } else {
                    Promise.all([
                        view(multicallAddress, "get_admins", {}).catch((e) => {}),
                        view(multicallAddress, "get_tokens", {}).catch((e) => {}),
                        view(multicallAddress, "get_jobs", {}).catch((e) => {}),
                        view(multicallAddress, "get_job_bond", {}).catch((e) => {}),
                        this.proposalAlreadyExists(newDao).catch((e) => {}),
                    ]).then(([admins, tokens, jobs, jobBond, proposalData]) =>
                        this.setState({
                            dao: newDao,
                            multicall: new Multicall(multicallAddress),
                            info: { admins, tokens, jobs, jobBond },
                            loading: false,
                            proposed: proposalData?.proposal_id || -1,
                            proposedInfo: (proposalData?.proposal_info as ProposalOutput) || null,
                        })
                    );
                }
            });
    }

    getContent() {
        const { selector: walletSelector } = this.context!;
        const { dao, info, loading, multicall } = this.state;

        // if user not logged in, remind them to sign in.
        // TODO: only require signIn when DAO has no multicall instance (to know if user can propose or vote on existing proposal to create multicall)
        if (!walletSelector.isSignedIn()) {
            return <div className="DaoPage-body error">Please sign in to continue</div>;
        }

        // errors to display
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
                <>
                    <div className="DaoPage-body error">
                        <div>{displayErrors}</div>
                        {this.createMulticall()}
                    </div>
                </>
            );

        if (loading) return <div className="DaoPage-body loader" />;

        // everything should be loaded
        if (!info.admins || !info.tokens || !info.jobBond) {
            console.error("info incomplete", info);
            return <div className="DaoPage-body error">Unexpected error! Multicall might be outdated.</div>;
        }

        return (
            <Tabs
                classes={{ buttonsPanel: "DaoPage-tabs-buttonsPanel", contentSpace: "DaoPage-tabs-contentSpace" }}
                items={[
                    {
                        title: "Config",

                        content: (
                            <div className={clsx("ConfigTab", "DaoPage-body")}>
                                <Facet className="AdminsList">
                                    <AddOutlined />
                                    <h1 className="title">Admins</h1>

                                    <ul className="list">
                                        {info.admins.map((admin) => (
                                            <li key={admin}>{this.toLink(admin)}</li>
                                        ))}
                                    </ul>
                                </Facet>

                                <Facet className="TokenWhitelist">
                                    <h1 className="title">Whitelisted Tokens</h1>

                                    <ul className="list">
                                        {info.tokens.map((token) => (
                                            <li key={token}>{this.toLink(token)}</li>
                                        ))}
                                    </ul>
                                </Facet>

                                <Facet className="JobsList">
                                    <AddOutlined />
                                    <h1 className="title">Jobs</h1>
                                    <Scrollable>{info.jobs.map((j) => this.job(j))}</Scrollable>
                                </Facet>

                                <Facet className="JobBond">
                                    <h1 className="JobBond-title title">
                                        Job Bond
                                        <span>{`${info.jobBond !== "..." ? toNEAR(info.jobBond) : "..."} Ⓝ`}</span>
                                    </h1>
                                </Facet>
                            </div>
                        ),
                    },
                    {
                        title: "Funds",
                        lazy: true,

                        content: (
                            <div className={clsx("FundsTab", "DaoPage-body")}>
                                <TokensBalances
                                    className="balances"
                                    daoContracts={{ dao, multicall }}
                                />
                            </div>
                        ),
                    },
                ]}
            />
        );
    }

    render() {
        return (
            <div className="DaoPage">
                <div className="DaoPage-header">
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
                                        <Field name="addr" />
                                    </Form>
                                );
                            }}
                        </Formik>
                    </div>
                </div>

                {this.getContent()}
            </div>
        );
    }
}
