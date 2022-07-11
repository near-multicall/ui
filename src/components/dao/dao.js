import { DeleteOutline, EditOutlined, AddOutlined, PauseOutlined, PlayArrowOutlined, TrendingUpOutlined } from '@mui/icons-material';
import { Base64 } from 'js-base64';
import React, { Component } from 'react';
import { ArgsAccount, ArgsError } from '../../utils/args';
import { toNEAR, toYocto, Big } from '../../utils/converter';
import { view } from '../../utils/wallet';
import { SputnikDAO, SputnikUI } from '../../utils/contracts/sputnik-dao';
import { TextInput } from '../editor/elements';
import { InputAdornment } from '@mui/material'
import './dao.scss';
import debounce from 'lodash.debounce';

// minimum balance a multicall instance needs for storage + state.
const MIN_INSTANCE_BALANCE = toYocto(1); // 1 NEAR

export default class Dao extends Component {

    errors = {
        addr: new ArgsError("Invalid NEAR address", value => ArgsAccount.isValid(value), !ArgsAccount.isValid(STORAGE.addresses?.dao ?? "")),
        noDao: new ArgsError("Sputnik DAO not found on given address", value => this.errors.noDao.isBad),
        noContract: new ArgsError("DAO has no multicall instance", value => this.errors.noContract.isBad),
        noAddProposalRights: new ArgsError("Permission to create a proposal on this dao", value => this.errors.noAddProposalRights),
        noApproveProposalRights: new ArgsError("Permission to approve a proposal on this dao", value => this.errors.noApproveProposalRights) 
    }

    loadInfoDebounced = debounce(() => this.loadInfos(), 500);

    lastAddr;

    constructor(props) {

        super(props);

        this.state = {
            addr: this.getBaseAddress(STORAGE.addresses?.dao ?? ""),
            loading: false,
            proposed: -1,
            proposedInfo: {},
            infos: {
                admins: [],
                tokens: [],
                jobs: [],
                bond: "...",
                policy: undefined
            }
        }

        window.WALLET
            .then(() => view(
                window.nearConfig.MULTICALL_FACTORY_ADDRESS,
                "get_fee",
                {}
            ))
            .then(res => {
                this.fee = res;
                this.loadInfos()
            })

    }

    componentDidMount() {

        window.DAO = this;

    }

    /**
     * check if DAO has a proposal to create multicall instance.
     * proposal must be in progress, and not expired.
     * 
     * @param {number} lastProposalID
     * @param {string} proposalPeriod After this duration (nanoseconds), a proposal expires.
     * @returns {object} ID and info of proposal to create multicall instance,
     */
    proposalAlreadyExists (lastProposalID, proposalPeriod) {

        const { addr } = this.state;
        const multicall = `${this.state.addr.value}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`;
        const dao_address = `${addr.value}.${SputnikDAO.FACTORY_ADDRESS}`;
        const dao = new SputnikDAO(dao_address);
        // Date.now() returns timestamp in milliseconds, SputnikDAO uses nanoseconds
        const currentTime = Big( Date.now() ).times("1000000");

        return dao.getProposals(
            {
                from_index: lastProposalID < 100 ? 0 : lastProposalID - 100,
                limit: 100
            }
        ).then(res => {

                const proposals = res.filter(p => {
                    // discard if not active proposal to create multicall instance
                    if (
                        ! (p.kind?.FunctionCall?.receiver_id === window.nearConfig.MULTICALL_FACTORY_ADDRESS)
                        || ! (p.kind?.FunctionCall?.actions?.[0]?.method_name === "create")
                        || ! (p.status === 'InProgress')
                    ) {
                        return false;
                    }
                    // calculate proposal expiration timestamp in nanoseconds
                    const expirationTime = Big(p.submission_time).add(proposalPeriod);
                    // check if proposal expired
                    return (expirationTime.gt(currentTime)) ? true : false;
                })

                // If there many "Create multicall" proposals, return latest.
                if (proposals.length > 0) {
                    const lastProposal = proposals.pop();
                    return { proposal_id: lastProposal.id, proposal_info: lastProposal };
                }
                // No "Create multicall" proposals found.
                else return { proposal_id: -1, proposal_info: {} };
                    
            }).catch(e => {})

    }

    onAddressesUpdated() {

        if (this.getBaseAddress(STORAGE.addresses.dao) !== this.state.addr.value)
            this.setState({
                addr: this.getBaseAddress(STORAGE.addresses.dao)
            }, () => {
                this.errors.addr.validOrNull(this.state.addr);
                this.loadInfos();
                this.forceUpdate();
            })

    }

    getBaseAddress(address) {

        let base;
        if (address.endsWith("." + SputnikDAO.FACTORY_ADDRESS))
            base = address.split("." + SputnikDAO.FACTORY_ADDRESS)[0];
        else if (address.endsWith("." + window.nearConfig.MULTICALL_FACTORY_ADDRESS))
            base = address.split("." + window.nearConfig.MULTICALL_FACTORY_ADDRESS)[0];
        else
            base = address

        return new ArgsAccount(base);

    }


    createMulticall() {

        if (this.fee === undefined)
            return;

        const { loading, addr, infos, proposed, proposedInfo } = this.state;
        const {
            noContract,
            noDao,
            noAddProposalRights,
            noApproveProposalRights
        } = this.errors;

        // happens if wallet not logged in
        if (infos.policy === undefined)
            return <></>;

        const multicall = `${this.state.addr.value}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`;
        const dao_address = `${addr.value}.${SputnikDAO.FACTORY_ADDRESS}`;
        const dao = new SputnikDAO(dao_address);

        const depo = Big(this.fee).plus(MIN_INSTANCE_BALANCE);

        const args = {
            proposal: {
                description: `create multicall instance for this DAO at ${multicall}`,
                kind: {
                    FunctionCall: {
                        receiver_id: window.nearConfig.MULTICALL_FACTORY_ADDRESS,
                        actions: [{
                            method_name: "create",
                            args: Base64.encode(JSON.stringify({
                                multicall_init_args: {
                                    admin_accounts: [dao_address],
                                    croncat_manager: window.nearConfig.CRONCAT_MANAGER_ADDRESS,
                                    job_bond: infos.policy.proposal_bond
                                },
                                public_key: "HdJuXFRBKMEXuzEsXVscdd3aoBvEGGXDKQ3JoNhqJ4uU"
                            })),
                            deposit: depo.toFixed(),
                            gas: "150000000000000"
                        }]
                    }
                }
            }
        };

        // console.log(
        //     "noContract", noContract.isBad, "\n",
        //     "noDao", noDao.isBad, "\n",
        //     "proposed", proposed !== -1, "\n",
        //     "noAddProposalRights", noAddProposalRights.isBad, "\n",
        //     "noApproveProposalRights", noApproveProposalRights.isBad, "\n",
        //     "user has voted", proposedInfo?.votes?.[window.account.accountId]
        // )

        if (
            noContract.isBad 
            && !noDao.isBad // base.sputnik.near does not exist
            && !loading
            && this.lastAddr === document.querySelector(".address-container input")._valueTracker.getValue() // disappear while debouncing
        ) {
            // no create multicall proposal exists
            if (proposed === -1) {
                // ... and user can propose FunctionCall
                if (!noAddProposalRights.isBad) {
                    return (
                        <>
                            <div className="info-text">
                                {/* hint: you can use "genesis" or "test" as DAO to get to this message */}
                                {`A multicall instance can only be created for `} 
                                <a href={ dao.getDaoUrl(SputnikUI.ASTRO_UI) } target="_blank" rel="noopener noreferrer">
                                    { dao_address }
                                </a>
                                {` by making a proposal.`}
                            </div>
                            <button 
                                className="create-multicall"
                                onClick={() => { dao.addProposal(args, infos.policy.proposal_bond); }}
                            >
                                Propose
                            </button>
                        </>
                    )
                } 
                // ... and user cannot propose FunctionCall
                else if (noAddProposalRights.isBad) {
                    return (
                        <div className="info-text">
                            {/* hint: you can use "ref-community-board-testnet" as DAO to get to this message */}
                            {`This DAO has no multicall instance. A DAO member with proposing permissions should make a proposal.`}
                        </div>
                    )
                }
            }
            // create multicall proposal exists
            else if (proposed !== -1) {
                // user does not have rights to VoteApprove
                if ( noApproveProposalRights.isBad ) {
                    return (
                        <div className="info-text">
                            {`Proposal to create a multicall exists (#${proposed}), but you have no voting permissions on this DAO.`}
                            <br/>
                            <a target="_blank" href={dao.getProposalUrl(SputnikUI.ASTRO_UI, proposed)} rel="noopener noreferrer">
                                Proposal on Astro
                            </a>
                        </div>
                    )
                }
                // user can VoteApprove and already voted
                else if ( proposedInfo.votes[window.account.accountId] ) {
                    return (
                        <div className="info-text">
                            {`You have voted on creating a multicall instance for this DAO. It will be created as soon as the proposal passes voting.`}
                            <br/>
                            <a target="_blank" href={dao.getProposalUrl(SputnikUI.ASTRO_UI, proposed)} rel="noopener noreferrer">
                                Proposal on Astro
                            </a>
                        </div>
                    )
                }
                // user can VoteApprove and did NOT vote yet.
                else {
                    return (
                        <>
                            <div className="info-text">
                                {/* hint: you can use "genesis" or "test" as DAO to get to this message */}
                                {`There exists a proposal (#${proposed}) to create a multicall instance for this DAO. `} 
                                <a href={ dao.getProposalUrl(SputnikUI.ASTRO_UI, proposed) } target="_blank" rel="noopener noreferrer">
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

        const addr = new ArgsAccount(address);

        return (
            <span>
                <a href={addr.toUrl(window.nearConfig.networkId)} target="_blank" rel="noopener noreferrer">
                    {addr.value}
                </a>
                { deleteIcon ? <DeleteOutline/> : null }
            </span>
        )
    }

    job(job) {

        return (
            <div class="job">
                <EditOutlined />
                <DeleteOutline />
                {job.is_active
                    ? <PauseOutlined />
                    : <PlayArrowOutlined />
                }
                <pre>{JSON.stringify(job, null, "  ")}</pre>
            </div>
        );

    }

    loadInfos() {

        const {
            addr,
            noContract,
            noDao,
            noAddProposalRights,
            noApproveProposalRights
        } = this.errors;

        const multicall = `${this.state.addr.value}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`;
        const dao_address = `${this.state.addr.value}.${SputnikDAO.FACTORY_ADDRESS}`;
        const dao = new SputnikDAO(dao_address);

        this.lastAddr = this.state.addr.value;



        noContract.isBad = false;
        noDao.isBad = false;
        noAddProposalRights.isBad = false;
        noApproveProposalRights.isBad = false;

        if (addr.isBad) {
            noContract.isBad = true;
            noDao.isBad = true;
            noAddProposalRights.isBad = true;
            noApproveProposalRights.isBad = true;
            this.setState({ proposed: -1, proposedInfo: {} })
        }

        this.setState({ loading: true });

        let newState = {};

        Promise.all([
            view(multicall, "get_admins", {}).catch(e => {
                    if (e.type === "AccountDoesNotExist" && e.toString().includes(` ${multicall} `)) {
                        noContract.isBad = true;
                    }
                }
            ),
            view(multicall, "get_tokens", {}).catch(e => {}),
            view(multicall, "get_jobs", {}).catch(e => {}),
            view(multicall, "get_job_bond", {}).catch(e => {}),
            dao.getLastProposalId().catch(e => {}),
            dao.getPolicy().catch(e => {
                    if (e.type === "AccountDoesNotExist" && e.toString().includes(` ${dao_address} `)) {
                        noDao.isBad = true;
                    }
                }
            )
        ])
        .then(([admins, tokens, jobs, bond, lastProposalID, policy]) => {
            newState = { 
                infos: {
                    admins: admins,
                    tokens: tokens,
                    jobs: jobs,
                    bond: bond,
                    policy: policy
                },
                loading: false
                // proposed & proposedInfo will be handled in the next "then()"
            }
            if (policy !== undefined) {
                return this.proposalAlreadyExists(lastProposalID, policy?.proposal_period).catch(e => {});
            }
        })
        .then(( result ) => {
            if (result !== undefined) {
                const { proposal_id, proposal_info } = result;
                newState.proposed = proposal_id;
                newState.proposedInfo = proposal_info;
            }
            else {
                newState.proposed = undefined;
                newState.proposedInfo = undefined;
            }
            
            // can user propose or vote on FunctionCall to DAO?
            const functionCallPermissions = newState.infos.policy?.roles
                .filter(r => r.kind === "Everyone" || r.kind.Group.includes(window.WALLET.state.wallet.getAccountId()))
                .map(r => r.permissions)
                .flat()
                .filter(permission => {
                    const [proposalKind, action] = permission.split(":");
                    return (proposalKind === "*" || proposalKind === "call");
                });
            const canPropose = functionCallPermissions?.some(permission => {
                    const [proposalKind, action] = permission.split(":");
                    return (action === "*" || action === "AddProposal");
                }
            );
            const canApprove = functionCallPermissions?.some(permission => {
                    const [proposalKind, action] = permission.split(":");
                    return (action === "*" || action === "VoteApprove");
                }
            );

            if ( ! canPropose ) noAddProposalRights.isBad = true; // no add proposal rights
            if ( ! canApprove ) noApproveProposalRights.isBad = true; // no vote approve proposal rights

            // update visuals
            this.setState(newState);
        })

    }

    getContent() {

        const {
            infos,
            loading,
        } = this.state;

        // wait for wallet to initialize
        if (!window.WALLET?.state?.wallet) {
            window.WALLET.then(() => this.forceUpdate());
            return;
        }

        const { wallet } = window.WALLET.state;

        // connect wallet
        if (!wallet.isSignedIn())
            return <div className="info-container error">
                Please sign in to continue
            </div>

        // errors to display
        const noDisplayErrors = ["noAddProposalRights", "noApproveProposalRights"]
        const displayErrors = Object.keys(this.errors)
            .filter(e => this.errors[e].isBad && !noDisplayErrors.includes(e))
            .map(e => <p key={`p-${e}`} className={"red"}>
                    <span>{ this.errors[e].isBad ? '\u2717' : '\u2714' }  </span>
                    { this.errors[e].message }
                </p>);

        if (displayErrors.length > 0)
            return (<>
                <div className="info-container error">
                    <div>{ displayErrors }</div>
                    { this.createMulticall() }
                </div>
            </>);

        // loading ...
        if (loading)
            return <div className="info-container loader"></div>

        // everything should be loaded
        if (!infos.admins || !infos.tokens || !infos.bond) {
            console.error("infos incomplete", infos);
            return <div className="info-container error">
                Unexpected error! Multicall might be outdated.
            </div>;
        }

        // infos found
        return <div className="info-container">
            <div className="info-card admins">
                <AddOutlined />
                <h1 className="title">Admins</h1>
                <ul className="list">
                    {infos.admins.map(a => <li key={infos.admins.id}>{this.toLink(a)}</li>)}
                </ul>
            </div>
            <div className="info-card tokens">
                <AddOutlined />
                <h1 className="title">Tokens</h1>
                <ul className="list">
                    {infos.tokens.map(t => <li key={infos.tokens.id}>{this.toLink(t)}</li>)}
                </ul>
            </div>
            <div className="info-card jobs">
                <AddOutlined />
                <h1 className="title">Jobs</h1>
                <div className="scroll-wrapper">
                    {infos.jobs.map(j => this.job(j))}
                </div>
            </div>
            <div className="info-card bond">
                <h1 className="title">Job Bond
                    <span>{`${infos.bond !== "..." ? toNEAR(infos.bond) : "..."} Ⓝ`}</span>
                </h1>
            </div>
        </div>

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
                            endAdornment: <InputAdornment position="end">{`.${SputnikDAO.FACTORY_ADDRESS}`}</InputAdornment>,
                        }}
                    />
                </div>
                {this.getContent()}
            </div>
        );

    }

}