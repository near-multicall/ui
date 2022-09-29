import { AddOutlined, DeleteOutline, EditOutlined, PauseOutlined, PlayArrowOutlined } from "@mui/icons-material";
import clsx from "clsx";
import { createEffect, forward } from "effector";
import { createForm, useForm } from "effector-forms";
import { useStore } from "effector-react";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import React from "react";
import { Component, ContextType } from "react";

import { useWalletSelector } from "../../contexts/walletSelectorContext";
import { Card, Scrollable, Tabs } from "../../shared/ui/components";
import { args } from "../../utils/args/args";
import { fields } from "../../utils/args/args-types/args-object";
import { Multicall } from "../../utils/contracts/multicall";
import { Proposal, ProposalAction, ProposalKind, SputnikDAO, SputnikUI } from "../../utils/contracts/sputnik-dao";
import { Big, toNEAR, toYocto } from "../../utils/converter";
import { STORAGE } from "../../utils/persistent";
import { view } from "../../utils/wallet";
import { FungibleTokenBalances } from "../token";
import "./dao.scss";
import "./funds.scss";
import "./multicall.scss";

// minimum balance a multicall instance needs for storage + state.
const MIN_INSTANCE_BALANCE = toYocto(1); // 1 NEAR
const Ctx = useWalletSelector();

interface Props {}

interface State {
    formData: {
        addr: string;
    };
    dao: SputnikDAO;
    multicall: Multicall;
    loading: boolean;
    proposed: number;
    proposedInfo: Proposal | null;

    info: {
        admins: string[];
        tokens: string[];
        jobs: unknown[];
        jobBond: string;
    };
}
export class Dao extends Component<Props, State> {
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
                    noMulticall: `${this.getBaseAddress(addr)}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`,
                }))
                .retain(),
        })
        .retain();

    tryLoadInfoDebounced = debounce(() => this.tryLoadInfo(), 400);

    lastAddr: string;
    fee?: string;
    searchDao: any;

    constructor(props: Props) {
        super(props);

        const addr = STORAGE.addresses.dao;

        this.state = {
            formData: {
                addr,
            },

            dao: new SputnikDAO(addr),
            multicall: new Multicall(`${this.getBaseAddress(addr)}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`),

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

        const formConfig = this.schema.intoFormConfig();
        formConfig.fields.addr.init = this.state.formData.addr;
        const form = createForm(formConfig),
            fx = createEffect();

        forward({
            from: form.formValidated,
            to: fx,
        });

        this.searchDao = { form, fx };

        document.addEventListener("onaddressesupdated", (e) => this.onAddressesUpdated(e as CustomEvent));

        this.lastAddr = this.state.formData.addr;
    }

    static contextType = Ctx;
    declare context: ContextType<typeof Ctx>;

    componentDidMount() {
        window.DAO_COMPONENT = this;
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
    proposalAlreadyExists(dao: SputnikDAO) {
        // Date.now() returns timestamp in milliseconds, SputnikDAO uses nanoseconds
        const currentTime = Big(Date.now()).times("1000000");
        const lastProposalId = dao.lastProposalId;
        const proposalPeriod = dao.policy.proposal_period;

        return dao
            .getProposals({
                from_index: lastProposalId < 100 ? 0 : lastProposalId - 100,
                limit: 100,
            })
            .then((response) => {
                const proposals = (response as Proposal[]).filter((proposal) => {
                    // discard if not active proposal to create multicall instance
                    if (
                        !(proposal.kind?.FunctionCall?.receiver_id === window.nearConfig.MULTICALL_FACTORY_ADDRESS) ||
                        !(proposal.kind?.FunctionCall?.actions?.[0]?.method_name === "create") ||
                        !(proposal.status === "InProgress")
                    ) {
                        return false;
                    }
                    // calculate proposal expiration timestamp in nanoseconds
                    const expirationTime = Big(proposal.submission_time).add(proposalPeriod);
                    // check if proposal expired
                    return expirationTime.gt(currentTime) ? true : false;
                });

                // If there many "Create multicall" proposals, return latest.
                if (proposals.length > 0) {
                    const lastProposal = proposals.pop();
                    return { proposal_id: lastProposal?.id, proposal_info: lastProposal };
                }
                // No "Create multicall" proposals found.
                else return { proposal_id: -1, proposal_info: null };
            })
            .catch((e) => {});
    }

    onAddressesUpdated(e: CustomEvent<{ dao: string }>) {
        if (e.detail.dao !== this.state.formData.addr) {
            this.setState(
                {
                    formData: {
                        addr: e.detail.dao,
                    },
                    multicall: new Multicall(
                        `${this.getBaseAddress(e.detail.dao)}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`
                    ),
                },
                this.tryLoadInfo
            );
        }
    }

    // TODO fix this
    getBaseAddress(address: string) {
        return args
            .string()
            .address()
            .transform((value) => {
                let base;
                if (value.endsWith("." + SputnikDAO.FACTORY_ADDRESS))
                    base = value.split("." + SputnikDAO.FACTORY_ADDRESS)[0];
                else if (value.endsWith("." + window.nearConfig.MULTICALL_FACTORY_ADDRESS))
                    base = value.split("." + window.nearConfig.MULTICALL_FACTORY_ADDRESS)[0];
                else base = value;

                return base;
            })
            .cast(address);
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

        // can user propose a FunctionCall to DAO?
        const canPropose = dao.checkUserPermission(accountId!, ProposalAction.AddProposal, ProposalKind.FunctionCall);

        // can user vote approve a FunctionCall on the DAO?
        const canApprove = dao.checkUserPermission(accountId!, ProposalAction.VoteApprove, ProposalKind.FunctionCall);

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
            this.lastAddr === (document.querySelector(".address-container input") as any)._valueTracker.getValue()
        ) {
            if (proposed === -1) {
                // no create multicall proposal exists

                if (canPropose) {
                    // ... and user can propose FunctionCall

                    return (
                        <>
                            <div className="info-text">
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
                        <div className="info-text">
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
                        <div className="info-text">
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
                } else if (proposedInfo!.votes[accountId!]) {
                    // user can VoteApprove and already voted

                    return (
                        <div className="info-text">
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
                            <div className="info-text">
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
            <div className="job">
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
            if (!this.schema.isBad()) {
                this.confidentlyLoadInfo();
            } else {
                this.setState({
                    proposed: -1,
                    proposedInfo: null,
                    dao: new SputnikDAO(this.state.formData.addr), // will be invalid
                });
            }
        });
    }

    confidentlyLoadInfo() {
        const { addr } = this.state.formData;
        const { noMulticall, noDao } = fields(this.schema, "addr");

        const baseAddresss = this.getBaseAddress(addr);
        const multicallAddress = `${baseAddresss}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`;
        const daoAddress = `${baseAddresss}.${SputnikDAO.FACTORY_ADDRESS}`;

        noMulticall.isBad(false);
        noDao.isBad(false);

        this.setState({ loading: true });

        // initialize DAO object
        SputnikDAO.init(daoAddress)
            .catch((e) => {})
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
                        this.setState(() => ({
                            dao: newDao,
                            multicall: new Multicall(multicallAddress),
                            info: { admins, tokens, jobs, jobBond },
                            loading: false,
                            proposed: proposalData?.proposal_id || -1,
                            proposedInfo: proposalData?.proposal_info || null,
                        }))
                    );
                }
            });
    }

    getContent() {
        const { selector: walletSelector } = this.context!;
        const { info, loading } = this.state;

        // if user not logged in, remind them to sign in.
        // TODO: only require signIn when DAO has no multicall instance (to know if user can propose or vote on existing proposal to create multicall)
        if (!walletSelector.isSignedIn()) {
            return <div className="info-container error">Please sign in to continue</div>;
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
                    <div className="info-container error">
                        <div>{displayErrors}</div>
                        {this.createMulticall()}
                    </div>
                </>
            );

        if (loading) return <div className="info-container loader" />;

        // everything should be loaded
        if (!info.admins || !info.tokens || !info.jobBond) {
            console.error("info incomplete", info);
            return <div className="info-container error">Unexpected error! Multicall might be outdated.</div>;
        }

        return (
            <Tabs
                classes={{ buttonsPanel: "DaoPageTabs-buttonsPanel", contentSpace: "DaoPageTabs-contentSpace" }}
                items={[
                    {
                        title: "Config",

                        content: (
                            <div className={clsx("multicall-tab", "info-container")}>
                                <Card className="admins">
                                    <AddOutlined />
                                    <h1 className="title">Admins</h1>

                                    <ul className="list">
                                        {info.admins.map((admin) => (
                                            <li key={admin}>{this.toLink(admin)}</li>
                                        ))}
                                    </ul>
                                </Card>

                                <Card className="token-whitelist">
                                    <h1 className="title">Whitelisted Tokens</h1>

                                    <ul className="list">
                                        {info.tokens.map((token) => (
                                            <li key={token}>{this.toLink(token)}</li>
                                        ))}
                                    </ul>
                                </Card>

                                <Card className="jobs">
                                    <AddOutlined />
                                    <h1 className="title">Jobs</h1>
                                    <Scrollable>{info.jobs.map((j) => this.job(j))}</Scrollable>
                                </Card>

                                <Card className="job-bond">
                                    <h1 className="title">
                                        Job Bond
                                        <span>{`${info.jobBond !== "..." ? toNEAR(info.jobBond) : "..."} Ⓝ`}</span>
                                    </h1>
                                </Card>
                            </div>
                        ),
                    },
                    {
                        title: "Funds",
                        lazy: true,

                        content: (
                            <div className={clsx("funds-tab", "info-container")}>
                                <FungibleTokenBalances
                                    className="balances"
                                    dao={this.state.dao}
                                    multicall={this.state.multicall}
                                />
                            </div>
                        ),
                    },
                ]}
            />
        );
    }

    searchDaoComponent = () => {
        const formInfo = useForm(this.searchDao.form);
        const pending = useStore(this.searchDao.fx.pending);
        return (
            <form>
                {this.schema.intoField(formInfo, "addr", {
                    props: {
                        placeholder: "Insert DAO name here",
                    },
                    postChange: (e) => {
                        this.setFormData({ addr: e.target.value });
                        this.tryLoadInfoDebounced();
                    },
                })}
            </form>
        );
    };

    render() {
        return (
            <div className="DaoPage-root">
                <div className="header">
                    <div className="address-container">
                        <this.searchDaoComponent />
                    </div>
                </div>

                {this.getContent()}
            </div>
        );
    }
}
