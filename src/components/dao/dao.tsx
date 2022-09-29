import { InputAdornment } from "@mui/material";
import { DeleteOutline, EditOutlined, AddOutlined, PauseOutlined, PlayArrowOutlined } from "@mui/icons-material";
import clsx from "clsx";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import { Component, ContextType } from "react";

import { ArgsAccount, ArgsError } from "../../utils/args";
import { STORAGE } from "../../utils/persistent";
import { toNEAR, toYocto, toGas, Big } from "../../utils/converter";
import { useWalletSelector } from "../../contexts/walletSelectorContext";
import { SputnikDAO, SputnikUI, ProposalKind, ProposalAction } from "../../utils/contracts/sputnik-dao";
import { Multicall } from "../../utils/contracts/multicall";
import { Card, Scrollable, Tabs } from "../../shared/ui/components";
import { TextInput } from "../editor/elements";
import { FungibleTokenBalances } from "../token";
import "./dao.scss";
import "./funds.scss";
import "./multicall.scss";

// minimum balance a multicall instance needs for storage + state.
const MIN_INSTANCE_BALANCE = toYocto(1); // 1 NEAR
const Ctx = useWalletSelector();

interface Props {}

interface State {
    name: ArgsAccount;
    dao: SputnikDAO;
    multicall: Multicall;
    loading: boolean;
    proposed: number;
    proposedInfo: object;
    jobs: unknown[];
}

export class Dao extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            name: ArgsAccount.getSubAccountAddress(STORAGE.addresses.dao),
            dao: new SputnikDAO(STORAGE.addresses.dao),
            multicall: new Multicall(STORAGE.addresses.multicall),
            loading: false,
            proposed: -1,
            proposedInfo: {},
            jobs: [],
        };

        Multicall.getFactoryFee().then((multicallFactoryFee) => {
            this.fee = multicallFactoryFee;
            this.loadInfo();
        });
    }

    static contextType = Ctx;
    declare context: ContextType<typeof Ctx>;

    errors = {
        name: new ArgsError(
            "Invalid NEAR address",
            (value) => ArgsAccount.isValid(value),
            !ArgsAccount.isValid(STORAGE.addresses.dao)
        ),
        noDao: new ArgsError("Sputnik DAO not found on given address", (value) => this.errors.noDao.isBad),
        noContract: new ArgsError("DAO has no multicall instance", (value) => this.errors.noContract.isBad),
    };

    loadInfoDebounced = debounce(() => this.loadInfo(), 400);

    lastAddr;

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
                const proposals = response.filter((proposal) => {
                    // discard if not active proposal to create multicall instance
                    if (
                        !(proposal.kind?.FunctionCall?.receiver_id === Multicall.FACTORY_ADDRESS) ||
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
                else return { proposal_id: -1, proposal_info: {} };
            })
            .catch((e) => {});
    }

    createMulticall() {
        const { accountId } = this.context!;
        const { loading, dao, multicall, proposed, proposedInfo } = this.state;
        const { noContract, noDao } = this.errors;

        if (
            this.fee === undefined ||
            // wallet not logged in or DAO object not initialized yet
            dao?.ready !== true
        ) {
            return null;
        }

        const depo = Big(this.fee).plus(MIN_INSTANCE_BALANCE);

        // can user propose a FunctionCall to DAO?
        const canPropose = dao.checkUserPermission(accountId!, ProposalAction.AddProposal, ProposalKind.FunctionCall);

        // can user vote approve a FunctionCall on the DAO?
        const canApprove = dao.checkUserPermission(accountId!, ProposalAction.VoteApprove, ProposalKind.FunctionCall);

        const args = {
            proposal: {
                description: `create multicall instance for this DAO at ${multicall.address}`,
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
                                gas: toGas("150"), // 150 Tgas
                            },
                        ],
                    },
                },
            },
        };

        if (
            noContract.isBad &&
            !noDao.isBad &&
            !loading &&
            // disappear while debouncing
            this.lastAddr === document.querySelector(".address-container input")._valueTracker.getValue()
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
                                    dao.addProposal(args);
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
                } else if (proposedInfo.votes[accountId]) {
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

    toLink(address, deleteIcon = false) {
        const name = new ArgsAccount(address);

        return (
            <span>
                <a
                    href={name.toUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {name.value}
                </a>
                {deleteIcon ? <DeleteOutline /> : null}
            </span>
        );
    }

    job(job) {
        return (
            <div className="job">
                <EditOutlined />
                <DeleteOutline />
                {job.is_active ? <PauseOutlined /> : <PlayArrowOutlined />}
                <pre>{JSON.stringify(job, null, "  ")}</pre>
            </div>
        );
    }

    loadInfo() {
        const { name: addrError, noContract, noDao } = this.errors;
        const { name } = this.state;

        const multicallAddress = `${name.value}.${Multicall.FACTORY_ADDRESS}`;
        const daoAddress = `${name.value}.${SputnikDAO.FACTORY_ADDRESS}`;

        if (this.lastAddr === name.value) return;

        this.lastAddr = name.value;
        noContract.isBad = false;
        noDao.isBad = false;

        // chosen address violates NEAR AccountId rules.
        if (addrError.isBad) {
            noContract.isBad = true;
            noDao.isBad = true;
            this.setState({ proposed: -1, proposedInfo: {} });
            return;
        }

        this.setState({ loading: true });

        // initialize DAO and multicall objects
        Promise.all([
            SputnikDAO.init(daoAddress).catch((e) => new SputnikDAO(daoAddress)),
            Multicall.init(multicallAddress).catch((e) => new Multicall(multicallAddress)),
        ]).then(([dao, multicall]) => {
            // DAO or multicall not ready => either no contract on the chosen address
            // or some error happened during object initialization.
            if (!dao.ready || !multicall.ready) {
                noContract.isBad = !multicall.ready;
                noDao.isBad = !dao.ready;
                this.setState({
                    dao,
                    multicall,
                    loading: false,
                });
                return;
            }
            // DAO and multicall correctly initialized, try to fetch multicall info
            else {
                Promise.all([
                    multicall.getJobs().catch((e) => {}),
                    this.proposalAlreadyExists(dao).catch((e) => {}),
                ]).then(([jobs, createMulticallProposalInfo]) => {
                    const { proposal_id, proposal_info } = createMulticallProposalInfo;

                    this.setState((prevState) => ({
                        dao,
                        multicall,
                        jobs: jobs,
                        loading: false,
                        proposed: proposal_id,
                        proposedInfo: proposal_info || {},
                    }));
                });
            }
        });
    }

    getContent() {
        const { selector: walletSelector } = this.context!;
        const { jobs, multicall, loading } = this.state;

        // TODO: only require signIn when DAO has no multicall instance (to know if user can propose or vote on existing proposal to create multicall)
        if (!walletSelector.isSignedIn()) {
            return <div className="info-container error">Please sign in to continue</div>;
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
                    <div className="info-container error">
                        <div>{displayErrors}</div>
                        {this.createMulticall()}
                    </div>
                </>
            );

        if (loading) return <div className="info-container loader" />;

        // everything should be loaded
        if (!multicall.admins || !multicall.tokensWhitelist || !multicall.jobBond) {
            console.error("multicall infos incomplete", multicall);
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
                                        {multicall.admins.map((admin) => (
                                            <li key={admin}>{this.toLink(admin)}</li>
                                        ))}
                                    </ul>
                                </Card>

                                <Card className="token-whitelist">
                                    <h1 className="title">Whitelisted Tokens</h1>

                                    <ul className="list">
                                        {multicall.tokensWhitelist.map((token) => (
                                            <li key={token}>{this.toLink(token)}</li>
                                        ))}
                                    </ul>
                                </Card>

                                <Card className="jobs">
                                    <AddOutlined />
                                    <h1 className="title">Jobs</h1>
                                    <Scrollable>{jobs.map((j) => this.job(j))}</Scrollable>
                                </Card>

                                <Card className="job-bond">
                                    <h1 className="title">
                                        Job Bond
                                        <span>{`${
                                            multicall.jobBond !== "" ? toNEAR(multicall.jobBond) : "..."
                                        } Ⓝ`}</span>
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

    onAddressesUpdated() {
        if (!this.state.name.equals(ArgsAccount.getSubAccountAddress(STORAGE.addresses.dao))) {
            this.setState(
                {
                    name: ArgsAccount.getSubAccountAddress(STORAGE.addresses.dao),
                },

                () => {
                    this.errors.name.validOrNull(this.state.name);
                    this.loadInfo();
                    this.forceUpdate();
                }
            );
        }
    }

    componentDidMount(): void {
        document.addEventListener("onaddressesupdated", () => this.onAddressesUpdated());
    }

    render() {
        return (
            <div className="DaoPage-root">
                <div className="header">
                    <div className="address-container">
                        <TextInput
                            placeholder="Insert DAO name here"
                            value={this.state.name}
                            error={this.errors.name}
                            update={() => {
                                if (this.state.name.isValid()) {
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
