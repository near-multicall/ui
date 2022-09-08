import { InputAdornment } from "@mui/material";
import { DeleteOutline, EditOutlined, AddOutlined, PauseOutlined, PlayArrowOutlined } from "@mui/icons-material";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import * as nearAPI from "near-api-js";
import React, { Component } from "react";

import { TokenLabel } from "../token/token";
import { ArgsAccount, ArgsError } from "../../utils/args";
import { STORAGE } from "../../utils/persistent";
import { toNEAR, toYocto, Big, formatTokenAmount } from "../../utils/converter";
import { view, viewAccount } from "../../utils/wallet";
import { useWalletSelector } from "../../contexts/walletSelectorContext";
import { SputnikDAO, SputnikUI, ProposalKind, ProposalAction } from "../../utils/contracts/sputnik-dao";
import { TextInput } from "../editor/elements";
import { FungibleToken } from "../../utils/standards/fungibleToken";
import { Table } from "../../shared/ui/components/table";
import { PageTabs } from "../../shared/ui/components/tabs";
import { NearIconFilled } from "../../shared/ui/components/icons";
import "./dao.scss";

// minimum balance a multicall instance needs for storage + state.
const MIN_INSTANCE_BALANCE = toYocto(1); // 1 NEAR

const TableHeader = ["Token", "Multicall", "DAO", "Total"];

export default class DaoComponent extends Component {
    static contextType = useWalletSelector();

    errors = {
        addr: new ArgsError(
            "Invalid NEAR address",
            (value) => ArgsAccount.isValid(value),
            !ArgsAccount.isValid(STORAGE.addresses.dao)
        ),
        noDao: new ArgsError("Sputnik DAO not found on given address", (value) => this.errors.noDao.isBad),
        noContract: new ArgsError("DAO has no multicall instance", (value) => this.errors.noContract.isBad),
    };

    loadInfoDebounced = debounce(() => this.loadInfo(), 400);

    lastAddr;

    constructor(props) {
        super(props);

        this.state = {
            addr: this.getBaseAddress(STORAGE.addresses.dao),
            dao: new SputnikDAO(STORAGE.addresses.dao),
            loading: false,
            proposed: -1,
            proposedInfo: {},
            rowContent: [["...", "...", "...", "..."]],
            info: {
                admins: [],
                tokens: [],
                jobs: [],
                bond: "...",
            },
        };

        view(window.nearConfig.MULTICALL_FACTORY_ADDRESS, "get_fee", {}).then((createMulticallFee) => {
            this.fee = createMulticallFee;
            this.loadInfo();
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
        if (this.getBaseAddress(STORAGE.addresses.dao) !== this.state.addr.value) {
            this.setState(
                {
                    addr: this.getBaseAddress(STORAGE.addresses.dao),
                },
                () => {
                    this.errors.addr.validOrNull(this.state.addr);
                    this.loadInfo();
                    this.forceUpdate();
                }
            );
        }
    }

    getBaseAddress(address) {
        let base;
        if (address.endsWith("." + SputnikDAO.FACTORY_ADDRESS))
            base = address.split("." + SputnikDAO.FACTORY_ADDRESS)[0];
        else if (address.endsWith("." + window.nearConfig.MULTICALL_FACTORY_ADDRESS))
            base = address.split("." + window.nearConfig.MULTICALL_FACTORY_ADDRESS)[0];
        else base = address;

        return new ArgsAccount(base);
    }

    createMulticall() {
        const { accountId } = this.context;
        const { loading, addr, dao, proposed, proposedInfo } = this.state;
        const { noContract, noDao } = this.errors;

        if (
            this.fee === undefined ||
            // wallet not logged in or DAO object not initialized yet
            dao?.ready !== true
        ) {
            return null;
        }

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
            noContract.isBad &&
            // base.sputnik-dao.near does not exist
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

    async nearInfo() {
        const { addr, dao } = this.state;
        const multicall = `${addr.value}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`;
        const nearBalanceMulticall = (await viewAccount(multicall)).amount;
        const nearBalanceDao = (await viewAccount(dao.address)).amount;

        return [
            <TokenLabel
                icon={<NearIconFilled />}
                symbol="NEAR"
            />,

            formatTokenAmount(nearBalanceMulticall, 24, 2),
            formatTokenAmount(nearBalanceDao, 24, 2),
            formatTokenAmount(Big(nearBalanceDao).add(nearBalanceMulticall).toFixed(), 24, 2),
        ];
    }

    async tokenInfo(multicall, dao) {
        const tokenAddrList = await FungibleToken.getLikelyTokenContracts(multicall);
        const likelyTokenList = await Promise.all(tokenAddrList.map((address) => FungibleToken.init(address)));
        const tokenList = likelyTokenList.filter((token) => token.ready === true);

        const balances = await Promise.all(
            tokenList.map(async (token) => {
                const [multicallBalance, daoBalance] = await Promise.all([
                    token.ftBalanceOf(multicall),
                    token.ftBalanceOf(dao.address),
                ]);

                return {
                    token,
                    multicallBalance: multicallBalance,
                    daoBalance: daoBalance,
                    total: Big(multicallBalance).add(daoBalance).toFixed(),
                };
            })
        );

        return balances.filter((el) => Big(el.total).gt("0"));
    }

    balancesToRows(multicall, dao) {
        return this.tokenInfo(multicall, dao).then((res) =>
            res.map(({ token, multicallBalance, daoBalance, total }) => [
                <TokenLabel {...token.metadata} />,
                formatTokenAmount(multicallBalance, token.metadata.decimals, 2),
                formatTokenAmount(daoBalance, token.metadata.decimals, 2),
                formatTokenAmount(total, token.metadata.decimals, 2),
            ])
        );
    }

    displayToken() {
        // format to show small balances
    }

    loadInfo() {
        const { addr: addrError, noContract, noDao } = this.errors;
        const { addr } = this.state;

        const multicall = `${addr.value}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`;
        const daoAddress = `${addr.value}.${SputnikDAO.FACTORY_ADDRESS}`;
        if (this.lastAddr === addr.value) return;

        this.lastAddr = addr.value;

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

        // initialize DAO object
        SputnikDAO.init(daoAddress)
            .catch((e) => {})
            .then((dao) => {
                if (!dao.ready) {
                    // DAO not ready => either no SputnikDAO contract on the chosen address
                    // or some error happened during DAO object init.

                    noContract.isBad = true;
                    noDao.isBad = true;
                    this.setState({ dao, loading: false });
                    return;
                } else {
                    // DAO correctly initialized, try to fetch multicall info

                    Promise.all([
                        view(multicall, "get_admins", {}).catch((e) => {
                            if (e.type === "AccountDoesNotExist" && e.toString().includes(` ${multicall} `)) {
                                noContract.isBad = true;
                            }
                        }),

                        view(multicall, "get_tokens", {}).catch((e) => {}),
                        view(multicall, "get_jobs", {}).catch((e) => {}),
                        view(multicall, "get_job_bond", {}).catch((e) => {}),
                        this.proposalAlreadyExists(dao).catch((e) => {}),
                        this.nearInfo(multicall, dao).catch((e) => {}),
                        this.balancesToRows(multicall, dao).catch((e) => {}),
                    ]).then(
                        ([
                            admins,
                            tokens,
                            jobs,
                            bond,
                            { proposal_id, proposal_info },
                            nearBalances,
                            fungibleTokenBalances,
                        ]) =>
                            this.setState({
                                dao,
                                rowContent: [nearBalances, ...fungibleTokenBalances],

                                info: {
                                    admins: admins,
                                    tokens: tokens,
                                    jobs: jobs,
                                    bond: bond,
                                },

                                loading: false,
                                proposed: proposal_id,
                                proposedInfo: proposal_info,
                            })
                    );
                }
            });
    }

    getContent() {
        const { selector: walletSelector } = this.context;
        const { info, loading, rowContent } = this.state;

        // TODO: only require signIn when DAO has no multicall instance (to know if user can propose or vote on existing proposal to create multicall)
        if (!walletSelector.isSignedIn()) {
            // if user not logged in, remind him to sign in.
            return <div className="info-container error">Please sign in to continue</div>;
        }

        // errors to display
        const displayErrorsList = ["addr", "noDao", "noContract"];
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
        if (!info.admins || !info.tokens || !info.bond) {
            console.error("info incomplete", info);
            return <div className="info-container error">Unexpected error! Multicall might be outdated.</div>;
        }

        // info found
        return (
            <PageTabs
                contents={[
                    <div className="info-container">
                        <div className="info-card admins">
                            <AddOutlined />
                            <h1 className="title">Admins</h1>

                            <ul className="list">
                                {info.admins.map((admin) => (
                                    <li key={admin}>{this.toLink(admin)}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="info-card wtokens">
                            <h1 className="title">Whitelisted Tokens</h1>
                            <ul className="list">
                                {info.tokens.map((token) => (
                                    <li key={token}>{this.toLink(token)}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="info-card jobs">
                            <AddOutlined />
                            <h1 className="title">Jobs</h1>
                            <div className="scroll-wrapper">{info.jobs.map((j) => this.job(j))}</div>
                        </div>

                        <div className="info-card bond">
                            <h1 className="title">
                                Job Bond
                                <span>{`${info.bond !== "..." ? toNEAR(info.bond) : "..."} Ⓝ`}</span>
                            </h1>
                        </div>
                    </div>,

                    <div className="info-container">
                        <div className="info-card tokens">
                            <h1 className="title">Token Balances</h1>

                            <Table
                                header={TableHeader}
                                rows={rowContent}
                            />
                        </div>
                    </div>,
                ]}
            />
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
                            if (this.state.addr.isValid) {
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
