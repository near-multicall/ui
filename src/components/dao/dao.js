import { DeleteOutline, EditOutlined, AddOutlined, PauseOutlined, PlayArrowOutlined } from '@mui/icons-material';
import { Base64 } from 'js-base64';
import React, { Component } from 'react';
import { ArgsAccount, ArgsError } from '../../utils/args';
import { STORAGE } from '../../utils/persistent';
import { toNEAR, toYocto, Big } from '../../utils/converter';
import { view } from '../../utils/wallet';
import { useWalletSelector } from '../../contexts/walletSelectorContext';
import { SputnikDAO, SputnikUI, ProposalKind, ProposalAction } from '../../utils/contracts/sputnik-dao';
import { TextInput } from '../editor/elements';
import { InputAdornment } from '@mui/material'
import './dao.scss';
import debounce from 'lodash.debounce';

// minimum balance a multicall instance needs for storage + state.
const MIN_INSTANCE_BALANCE = toYocto(1); // 1 NEAR

export default class DaoComponent extends Component {
    static contextType = useWalletSelector();

    errors = {
        addr: new ArgsError("Invalid NEAR address", value => ArgsAccount.isValid(value), !ArgsAccount.isValid(STORAGE.addresses.dao)),
        noDao: new ArgsError("Sputnik DAO not found on given address", value => this.errors.noDao.isBad),
        noContract: new ArgsError("DAO has no multicall instance", value => this.errors.noContract.isBad),
    }

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
                bond: "..."
            }
        }

        view(
            window.nearConfig.MULTICALL_FACTORY_ADDRESS,
            "get_fee",
            {}
        )
        .then(createMulticallFee => {
            this.fee = createMulticallFee;
            this.loadInfos()
        });

        document.addEventListener('onaddressesupdated', (e) => this.onAddressesUpdated(e))

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
    proposalAlreadyExists (dao) {
        // Date.now() returns timestamp in milliseconds, SputnikDAO uses nanoseconds
        const currentTime = Big( Date.now() ).times("1000000");
        const lastProposalId = dao.lastProposalId;
        const proposalPeriod = dao.policy.proposal_period;

        return dao.getProposals({
            from_index: lastProposalId < 100 ? 0 : lastProposalId - 100,
            limit: 100
        }).then(res => {

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

        if (this.getBaseAddress(STORAGE.addresses.dao) !== this.state.addr.value) {
            this.setState({
                addr: this.getBaseAddress(STORAGE.addresses.dao)
            }, () => {
                this.errors.addr.validOrNull(this.state.addr);
                this.loadInfos();
                this.forceUpdate();
            })
        }

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
        const { accountId } = this.context;

        if (this.fee === undefined)
            return;

        const { loading, addr, dao, infos, proposed, proposedInfo } = this.state;
        const { noContract, noDao } = this.errors;

        // happens if wallet not logged in or DAO object not initialized yet
        if (dao?.ready !== true)
            return <></>;

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
                        actions: [{
                            method_name: "create",
                            args: Base64.encode(JSON.stringify({
                                multicall_init_args: {
                                    admin_accounts: [dao.address],
                                    croncat_manager: window.nearConfig.CRONCAT_MANAGER_ADDRESS,
                                    job_bond: dao.policy.proposal_bond
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

        if (
            noContract.isBad 
            && !noDao.isBad // base.sputnik-dao.near does not exist
            && !loading
            && this.lastAddr === document.querySelector(".address-container input")._valueTracker.getValue() // disappear while debouncing
        ) {
            // no create multicall proposal exists
            if (proposed === -1) {
                // ... and user can propose FunctionCall
                if ( canPropose ) {
                    return (
                        <>
                            <div className="info-text">
                                {/* hint: you can use "genesis" or "test" as DAO to get to this message */}
                                {`A multicall instance can only be created for `} 
                                <a href={ dao.getDaoUrl(SputnikUI.ASTRO_UI) } target="_blank" rel="noopener noreferrer">
                                    { dao.address }
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
                else {
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
                if ( !canApprove ) {
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
                else if ( proposedInfo.votes[accountId] ) {
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
                <a href={addr.toUrl()} target="_blank" rel="noopener noreferrer">
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

        let newState = {};

        // initialize DAO object
        SputnikDAO.init(daoAddress).catch(e => {})
        .then((newDAO) => {
            // DAO not ready => either no SputnikDAO contract on the chosen address
            // or some error happened during DAO object init.
            if (!newDAO.ready) {
                noContract.isBad = true;
                noDao.isBad = true;
                this.setState({
                    dao: newDAO, 
                    loading: false 
                });
                return;
            }
            // DAO correctly initialized, try to fetch multicall info
            else {
                Promise.all([
                    view(multicall, "get_admins", {}).catch(e => {
                        if (e.type === "AccountDoesNotExist" && e.toString().includes(` ${multicall} `)) {
                            noContract.isBad = true;
                        }
                    }),
                    view(multicall, "get_tokens", {}).catch(e => {}),
                    view(multicall, "get_jobs", {}).catch(e => {}),
                    view(multicall, "get_job_bond", {}).catch(e => {}),
                    this.proposalAlreadyExists(newDAO).catch(e => {})
                ])
                .then(([admins, tokens, jobs, bond, createMulticallProposalInfo]) => {
                    const { proposal_id, proposal_info } = createMulticallProposalInfo;
        
                    newState = {
                        dao: newDAO,
                        infos: {
                            admins: admins,
                            tokens: tokens,
                            jobs: jobs,
                            bond: bond
                        },
                        loading: false,
                        proposed: proposal_id,
                        proposedInfo: proposal_info
                    }
        
                    // update visuals
                    this.setState(newState);
                })     
            }

        });

    }

    getContent() {
        const { selector: walletSelector } = this.context;
        const { infos, loading } = this.state;

        // if user not logged in, remind him to sign in.
        // TODO: only require signIn when DAO has no multicall instance (to know if user can propose or vote on existing proposal to create multicall)
        if (!walletSelector.isSignedIn())
            return <div className="info-container error">
                Please sign in to continue
            </div>

        // errors to display
        const displayErrorsList = ["addr", "noDao", "noContract"];
        const displayErrors = Object.keys(this.errors)
            .filter(e => this.errors[e].isBad && displayErrorsList.includes(e))
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
