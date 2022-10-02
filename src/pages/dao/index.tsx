import { AddOutlined, DeleteOutline, EditOutlined, PauseOutlined, PlayArrowOutlined } from "@mui/icons-material";
import { InputAdornment } from "@mui/material";
import clsx from "clsx";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import { Component, ContextType } from "react";

import { Wallet } from "../../entities";
import { ArgsAccount, ArgsError } from "../../shared/lib/args";
import { Multicall } from "../../shared/lib/contracts/multicall";
import type { ProposalOutput } from "../../shared/lib/contracts/sputnik-dao";
import { ProposalStatus, SputnikDAO, SputnikUI } from "../../shared/lib/contracts/sputnik-dao";
import { Big, toNEAR, toYocto } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { view } from "../../shared/lib/wallet";
import { Card, Scrollable, Tabs } from "../../shared/ui/components";
import { TextInput } from "../../widgets/editor/elements";
import { TokensBalances } from "../../widgets/tokens-balances";
import "./config/tab.scss";
import "./funds/tab.scss";
import "./page.scss";

// minimum balance a multicall instance needs for storage + state.
const MIN_INSTANCE_BALANCE = toYocto(1); // 1 NEAR
const Ctx = Wallet.useSelector();

interface Props {}

interface State {
    name: ArgsAccount;
    dao: SputnikDAO;
    multicall: Multicall;
    loading: boolean;
    proposed: number;
    proposedInfo: ProposalOutput;

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

    errors: { [key: string]: ArgsError } = {
        name: new ArgsError(
            "Invalid NEAR address",
            (input) => ArgsAccount.isValid(`${input.value}.${SputnikDAO.FACTORY_ADDRESS}`),
            !ArgsAccount.isValid(STORAGE.addresses.dao)
        ),
        noDao: new ArgsError("Sputnik DAO not found on given address", (value) => this.errors.noDao.isBad),
        noContract: new ArgsError("DAO has no multicall instance", (value) => this.errors.noContract.isBad),
    };

    loadInfoDebounced = debounce(() => this.loadInfo(), 400);

    lastAddr: string = "";
    // Multicall factory fee.
    fee: string = "";

    constructor(props: Props) {
        super(props);

        // split DAO address into parent address and rest (name).
        const deconstructedDaoAddress = ArgsAccount.deconstructAddress(STORAGE.addresses.dao);

        this.state = {
            name: new ArgsAccount(deconstructedDaoAddress.name),
            dao: new SputnikDAO(STORAGE.addresses.dao),
            multicall: new Multicall(`${deconstructedDaoAddress.name}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`),
            loading: false,
            proposed: -1,
            proposedInfo: {},

            info: {
                admins: [],
                tokens: [],
                jobs: [],
                jobBond: "...",
            },
        };

        view(window.nearConfig.MULTICALL_FACTORY_ADDRESS, "get_fee", {}).then((createMulticallFee) => {
            this.fee = createMulticallFee;
            this.loadInfo();
        });
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
        const activeProposals = proposals.filter((proposal) => {
            // discard if not active proposal to create multicall instance
            if (
                !(proposal.kind?.FunctionCall?.receiver_id === window.nearConfig.MULTICALL_FACTORY_ADDRESS) ||
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
        else return { proposal_id: -1, proposal_info: {} };
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

        const depo = Big(this.fee).plus(MIN_INSTANCE_BALANCE);
        const daoSearchInput: HTMLInputElement = document.querySelector(".DaoSearch input")!;

        // can user propose a FunctionCall to DAO?
        const canPropose = dao.checkUserPermission(accountId!, "AddProposal", "FunctionCall");

        // can user vote approve a FunctionCall on the DAO?
        const canApprove = dao.checkUserPermission(accountId!, "VoteApprove", "FunctionCall");

        const args = {
            proposal: {
                description: `create multicall instance for this DAO at ${this.state.multicall.address}`,

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
                } else if (proposedInfo.votes[accountId!]) {
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

    toLink(address: string, deleteIcon: boolean = false) {
        const addr = new ArgsAccount(address);

        return (
            <span>
                <a
                    href={addr.toUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {addr.value}
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

    loadInfo() {
        const { name: nameError, noContract, noDao } = this.errors;
        const { name } = this.state;

        const multicallAddress = `${name.value}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`;
        const daoAddress = `${name.value}.${SputnikDAO.FACTORY_ADDRESS}`;

        if (this.lastAddr === name.value) return;

        this.lastAddr = name.value;
        noContract.isBad = false;
        noDao.isBad = false;

        // chosen address violates NEAR AccountId rules.
        if (nameError.isBad) {
            noContract.isBad = true;
            noDao.isBad = true;
            this.setState({ proposed: -1, proposedInfo: {} });
            return;
        }

        this.setState({ loading: true });

        // initialize DAO object
        SputnikDAO.init(daoAddress)
            // on error, return non-initialized DAO object, as ready = false per default
            .catch((e) => new SputnikDAO(daoAddress))
            .then((dao) => {
                if (!dao.ready) {
                    // DAO not ready => either no SputnikDAO contract on the chosen address
                    // or some error happened during DAO object init.
                    noContract.isBad = true;
                    noDao.isBad = true;
                    this.setState({ dao, multicall: new Multicall(multicallAddress), loading: false });
                    return;
                } else {
                    // DAO correctly initialized, try to fetch multicall info
                    Promise.all([
                        view(multicallAddress, "get_admins", {}).catch((e) => {
                            if (e.type === "AccountDoesNotExist" && e.toString().includes(` ${multicallAddress} `)) {
                                noContract.isBad = true;
                            }
                        }),

                        view(multicallAddress, "get_tokens", {}).catch((e) => {}),
                        view(multicallAddress, "get_jobs", {}).catch((e) => {}),
                        view(multicallAddress, "get_job_bond", {}).catch((e) => {}),
                        this.proposalAlreadyExists(dao).catch((e) => {}),
                    ]).then(([admins, tokens, jobs, jobBond, proposalData]) =>
                        this.setState((prevState) => ({
                            dao,
                            multicall: new Multicall(multicallAddress),
                            info: { admins, tokens, jobs, jobBond },
                            loading: false,
                            proposed: proposalData?.proposal_id,
                            proposedInfo: proposalData?.proposal_info || {},
                        }))
                    );
                }
            });
    }

    getContent() {
        const { selector: walletSelector } = this.context!;
        const { dao, info, loading, multicall } = this.state;

        // TODO: only require signIn when DAO has no multicall instance (to know if user can propose or vote on existing proposal to create multicall)
        if (!walletSelector.isSignedIn()) {
            return <div className="DaoPage-body error">Please sign in to continue</div>;
        }

        const displayErrorsList = ["name", "noDao", "noContract"];

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
                                <Card className="AdminsList">
                                    <AddOutlined />
                                    <h1 className="title">Admins</h1>

                                    <ul className="list">
                                        {info.admins.map((admin) => (
                                            <li key={admin}>{this.toLink(admin)}</li>
                                        ))}
                                    </ul>
                                </Card>

                                <Card className="TokenWhitelist">
                                    <h1 className="title">Whitelisted Tokens</h1>

                                    <ul className="list">
                                        {info.tokens.map((token) => (
                                            <li key={token}>{this.toLink(token)}</li>
                                        ))}
                                    </ul>
                                </Card>

                                <Card className="JobsList">
                                    <AddOutlined />
                                    <h1 className="title">Jobs</h1>
                                    <Scrollable>{info.jobs.map((j) => this.job(j))}</Scrollable>
                                </Card>

                                <Card className="JobBond">
                                    <h1 className="JobBond-title title">
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

    onAddressesUpdated() {
        const { name } = this.state;
        const daoAccount = new ArgsAccount(STORAGE.addresses.dao);
        if (!(name.value === daoAccount.deconstructAddress().name)) {
            this.setState(
                {
                    name: new ArgsAccount(daoAccount.deconstructAddress().name),

                    multicall: new Multicall(
                        `${daoAccount.deconstructAddress().name}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`
                    ),
                },

                () => {
                    this.errors.name.validOrNull(daoAccount);
                    this.loadInfo();
                    this.forceUpdate();
                }
            );
        }
    }

    componentDidMount(): void {
        window.PAGE = "dao";
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
                            error={this.errors.name}
                            update={() => {
                                const fullDaoAddr = `${name.value}.${SputnikDAO.FACTORY_ADDRESS}`;
                                const daoAccount = new ArgsAccount(fullDaoAddr);
                                if (daoAccount.isValid()) {
                                    this.loadInfoDebounced();
                                }
                                this.forceUpdate();
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
