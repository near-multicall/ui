import { AddOutlined, DeleteOutline, EditOutlined, PauseOutlined, PlayArrowOutlined } from "@mui/icons-material";
import { InputAdornment } from "@mui/material";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import React, { Component } from "react";
import { useWalletSelector } from "../../contexts/walletSelectorContext";
import { args } from "../../utils/args";
import { ProposalAction, ProposalKind, SputnikDAO, SputnikUI } from "../../utils/contracts/sputnik-dao";
import { Big, toNEAR, toYocto } from "../../utils/converter";
import { STORAGE } from "../../utils/persistent";
import { view } from "../../utils/wallet";
import { TextInput } from "../editor/elements";
import "./dao.scss";

// minimum balance a multicall instance needs for storage + state.
const MIN_INSTANCE_BALANCE = toYocto(1); // 1 NEAR

export default class DaoComponent extends Component {
    static contextType = useWalletSelector();

    errors = {
        noDao: args.error(args.string().sputnikDao("Address is not a DAO")),
        noMulticall: args.error(args.string().multicall("DAO does not have a multicall instance")),
    };

    loadInfoDebounced = debounce(() => this.loadInfos(), 400);

    lastAddr;

    constructor(props) {
        super(props);

        this.state = {
            addr: this.getBaseAddress(STORAGE.addresses.dao),
            dao: new SputnikDAO(STORAGE.addresses.dao),
            loading: false,
            proposed: -1,
            proposedInfo: {},
            infos: {
                admins: [],
                tokens: [],
                jobs: [],
                bond: "...",
            },
        };

        view(window.nearConfig.MULTICALL_FACTORY_ADDRESS, "get_fee", {}).then((createMulticallFee) => {
            this.fee = createMulticallFee;
            this.loadInfos();
        });

        document.addEventListener("onaddressesupdated", (e) => this.onAddressesUpdated(e));
    }

    componentDidMount() {
        window.DAO_COMPONENT = this;
    }

    /**
     * check if DAO has a proposal to create multicall instance.
     * proposal must be in progress, and not expired.
     *
     * @returns {object} ID and info of proposal to create multicall instance,
     */
    proposalAlreadyExists(dao) {
        // Date.now() returns timestamp in milliseconds, SputnikDAO uses nanoseconds
        const currentTime = Big(Date.now()).times("1000000");
        const lastProposalId = dao.lastProposalId;
        const proposalPeriod = dao.policy.proposal_period;

        return dao
            .getProposals({
                from_index: lastProposalId < 100 ? 0 : lastProposalId - 100,
                limit: 100,
            })
            .then((res) => {
                const proposals = res.filter((p) => {
                    // discard if not active proposal to create multicall instance
                    if (
                        !(p.kind?.FunctionCall?.receiver_id === window.nearConfig.MULTICALL_FACTORY_ADDRESS) ||
                        !(p.kind?.FunctionCall?.actions?.[0]?.method_name === "create") ||
                        !(p.status === "InProgress")
                    ) {
                        return false;
                    }
                    // calculate proposal expiration timestamp in nanoseconds
                    const expirationTime = Big(p.submission_time).add(proposalPeriod);
                    // check if proposal expired
                    return expirationTime.gt(currentTime) ? true : false;
                });

                // If there many "Create multicall" proposals, return latest.
                if (proposals.length > 0) {
                    const lastProposal = proposals.pop();
                    return { proposal_id: lastProposal.id, proposal_info: lastProposal };
                }
                // No "Create multicall" proposals found.
                else return { proposal_id: -1, proposal_info: {} };
            })
            .catch((e) => {});
    }

    onAddressesUpdated() {
        if (this.getBaseAddress(STORAGE.addresses.dao) !== this.state.addr) {
            this.setState(
                {
                    addr: this.getBaseAddress(STORAGE.addresses.dao),
                },
                () => {
                    this.errors.addr.check(this.state.addr);
                    this.loadInfos();
                    this.forceUpdate();
                }
            );
        }
    }

    getBaseAddress(address) {
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
        const { accountId } = this.context;

        if (this.fee === undefined) return;

        const { loading, addr, dao, proposed, proposedInfo } = this.state;
        const { noMulticall, noDao } = this.errors;

        // happens if wallet not logged in or DAO object not initialized yet
        if (dao?.ready !== true) return <></>;

        const multicall = `${addr.value}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`;
        const depo = Big(this.fee).plus(MIN_INSTANCE_BALANCE);
        // can user propose a FunctionCall to DAO?
        const canPropose = dao.checkUserPermission(accountId, ProposalAction.AddProposal, ProposalKind.FunctionCall);
        // can user vote approve a FunctionCall on the DAO?
        const canApprove = dao.checkUserPermission(accountId, ProposalAction.VoteApprove, ProposalKind.FunctionCall);

        const args = {
            proposal: {
                description: `create multicall instance for this DAO at ${multicall}`,
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
            noMulticall.isBad &&
            !noDao.isBad && // base.sputnik-dao.near does not exist
            !loading &&
            this.lastAddr === document.querySelector(".address-container input")._valueTracker.getValue() // disappear while debouncing
        ) {
            // no create multicall proposal exists
            if (proposed === -1) {
                // ... and user can propose FunctionCall
                if (canPropose) {
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
                }
                // ... and user cannot propose FunctionCall
                else {
                    return (
                        <div className="info-text">
                            {/* hint: you can use "ref-community-board-testnet" as DAO to get to this message */}
                            {`This DAO has no multicall instance. A DAO member with proposing permissions should make a proposal.`}
                        </div>
                    );
                }
            }
            // create multicall proposal exists
            else if (proposed !== -1) {
                // user does not have rights to VoteApprove
                if (!canApprove) {
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
                }
                // user can VoteApprove and already voted
                else if (proposedInfo.votes[accountId]) {
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
                }
                // user can VoteApprove and did NOT vote yet.
                else {
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

    toLink(address, deleteIcon = true) {
        return (
            <span>
                <a
                    href={args.string().account().intoUrl().cast(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {address}
                </a>
                {deleteIcon ? <DeleteOutline /> : null}
            </span>
        );
    }

    job(job) {
        return (
            <div class="job">
                <EditOutlined />
                <DeleteOutline />
                {job.is_active ? <PauseOutlined /> : <PlayArrowOutlined />}
                <pre>{JSON.stringify(job, null, "  ")}</pre>
            </div>
        );
    }

    // TODO use args.error().check() to check noMulticall & noDao
    loadInfos() {
        const { noMulticall, noDao } = this.errors;
        const { addr } = this.state;

        const multicallAddress = `${addr}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`;
        const daoAddress = `${addr}.${SputnikDAO.FACTORY_ADDRESS}`;

        if (this.lastAddr === addr) return;
        this.lastAddr = addr;

        noMulticall.isBad = false;
        noDao.isBad = false;

        // chosen address violates NEAR AccountId rules.
        if (args.string().address().isValidSync(addr)) {
            noMulticall.isBad = true;
            noDao.isBad = true;
            this.setState({ proposed: -1, proposedInfo: {} });
            return;
        }

        this.setState({ loading: true });

        let newState = {};

        // initialize DAO object
        Promise.all([
            SputnikDAO.init(daoAddress).catch((e) => {}),
            noMulticall.checkAsync(multicallAddress),
            noDao.checkAsync(daoAddress),
        ]).then(([newDAO, _noMulticallIsBad, _noDaoIsBad]) => {
            // DAO not ready => either no SputnikDAO contract on the chosen address
            // or some error happened during DAO object init.
            if (!newDAO.ready) {
                noMulticall.isBad = true;
                noDao.isBad = true;
                this.setState({
                    dao: newDAO,
                    loading: false,
                });
                return;
            }
            // DAO correctly initialized, try to fetch multicall info
            else {
                Promise.all([
                    view(multicallAddress, "get_admins", {}).catch((e) => {}),
                    view(multicallAddress, "get_tokens", {}).catch((e) => {}),
                    view(multicallAddress, "get_jobs", {}).catch((e) => {}),
                    view(multicallAddress, "get_job_bond", {}).catch((e) => {}),
                    this.proposalAlreadyExists(newDAO).catch((e) => {}),
                ]).then(([admins, tokens, jobs, bond, createMulticallProposalInfo]) => {
                    const { proposal_id, proposal_info } = createMulticallProposalInfo;

                    newState = {
                        dao: newDAO,
                        infos: {
                            admins: admins,
                            tokens: tokens,
                            jobs: jobs,
                            bond: bond,
                        },
                        loading: false,
                        proposed: proposal_id,
                        proposedInfo: proposal_info,
                    };

                    // update visuals
                    this.setState(newState);
                });
            }
        });
    }

    getContent() {
        const { selector: walletSelector } = this.context;
        const { infos, loading } = this.state;

        // if user not logged in, remind him to sign in.
        // TODO: only require signIn when DAO has no multicall instance (to know if user can propose or vote on existing proposal to create multicall)
        if (!walletSelector.isSignedIn()) return <div className="info-container error">Please sign in to continue</div>;

        // errors to display
        const displayErrorsList = ["addr", "noDao", "noMulticall"];
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

        // loading ...
        if (loading) return <div className="info-container loader"></div>;

        // everything should be loaded
        if (!infos.admins || !infos.tokens || !infos.bond) {
            console.error("infos incomplete", infos);
            return <div className="info-container error">Unexpected error! Multicall might be outdated.</div>;
        }

        // infos found
        return (
            <div className="info-container">
                <div className="info-card admins">
                    <AddOutlined />
                    <h1 className="title">Admins</h1>
                    <ul className="list">
                        {infos.admins.map((a) => (
                            <li key={infos.admins.id}>{this.toLink(a)}</li>
                        ))}
                    </ul>
                </div>
                <div className="info-card tokens">
                    <AddOutlined />
                    <h1 className="title">Tokens</h1>
                    <ul className="list">
                        {infos.tokens.map((t) => (
                            <li key={infos.tokens.id}>{this.toLink(t)}</li>
                        ))}
                    </ul>
                </div>
                <div className="info-card jobs">
                    <AddOutlined />
                    <h1 className="title">Jobs</h1>
                    <div className="scroll-wrapper">{infos.jobs.map((j) => this.job(j))}</div>
                </div>
                <div className="info-card bond">
                    <h1 className="title">
                        Job Bond
                        <span>{`${infos.bond !== "..." ? toNEAR(infos.bond) : "..."} Ⓝ`}</span>
                    </h1>
                </div>
            </div>
        );
    }

    render() {
        const { addr } = this.state;

        return (
            <div className="dao-container">
                <div className="address-container">
                    <TextInput
                        placeholder="Insert DAO name here"
                        value={addr}
                        error={this.errors.addr}
                        update={() => {
                            if (args.string().address().isValidSync(addr)) {
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
                {this.getContent()}
            </div>
        );
    }
}
