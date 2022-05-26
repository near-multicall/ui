import { DeleteOutline, EditOutlined, AddOutlined, PauseOutlined, PlayArrowOutlined } from '@mui/icons-material';
import { Base64 } from 'js-base64';
import React, { Component } from 'react';
import { ArgsAccount, ArgsError } from '../../utils/args';
import { toNEAR, toYocto, Big } from '../../utils/converter';
import { view, tx } from '../../utils/wallet';
import { TextInput } from '../editor/elements';
import { InputAdornment } from '@mui/material'
import './dao.scss';


// minimum balance a multicall instance needs for storage + state.
const MIN_INSTANCE_BALANCE = toYocto(1); // 1 NEAR


export default class Dao extends Component {

    errors = {
        addr: new ArgsError("Address valid", value => ArgsAccount.isValid(value), !ArgsAccount.isValid(STORAGE.addresses?.dao ?? "")),
        noContract: new ArgsError("Multicall found", value => this.errors.noContract.isBad),
        noDao: new ArgsError("Sputnik dao found", value => this.errors.noDao.isBad),
        noRights: new ArgsError("Permission to create a proposal on this dao", value => this.errors.noRights), 
    }

    lastInput;
    lastAddr;

    constructor(props) {

        super(props);

        this.state = {
            addr: this.getBaseAddress(STORAGE.addresses?.dao ?? ""),
            loading: false,
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
        if (address.endsWith("." + window.nearConfig.SPUTNIK_V2_FACTORY_ADDRESS))
            base = address.split("." + window.nearConfig.SPUTNIK_V2_FACTORY_ADDRESS)[0];
        else if (address.endsWith("." + window.nearConfig.MULTICALL_FACTORY_ADDRESS))
            base = address.split("." + window.nearConfig.MULTICALL_FACTORY_ADDRESS)[0];
        else
            base = address

        return new ArgsAccount(base);

    }


    createMulticall() {

        if (this.fee === undefined)
            return;

        const { loading, addr, infos } = this.state;
        const {
            noContract,
            noDao,
            noRights
        } = this.errors;

        // happens if wallet not logged in
        if (infos.policy === undefined)
            return <></>;

        const multicall = `${this.state.addr.value}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`;
        const sputnik = `${addr.value}.${window.nearConfig.SPUTNIK_V2_FACTORY_ADDRESS}`;

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
                                    admin_accounts: [sputnik],
                                    croncat_manager: window.nearConfig.CRONCAT_MANAGER_ADDRESS,
                                    job_bond: infos.policy.proposal_bond
                                }
                            })),
                            deposit: depo.toFixed(),
                            gas: "150000000000000"
                        }]
                    }
                }
            }
        };

        if (noContract.isBad 
            && !noDao.isBad // base.sputnik.near does not exist
            && !noRights.isBad // user is not permissioned
            && !loading
            && this.lastAddr === document.querySelector(".address-container input")._valueTracker.getValue()) // disappear while debouncing
            return (
                <button 
                    className="create-multicall"
                    onClick={() => {
                        tx(
                            sputnik,
                            "add_proposal",
                            args,
                            10_000_000_000_000,
                            infos.policy.proposal_bond
                        )
                    }}
                >
                    {`create a multicall for ${sputnik}`}
                </button>
            )

    }

    toLink(address) {

        const addr = new ArgsAccount(address);

        return (
            <span>
                <a href={ addr.toUrl(window.nearConfig.networkId) } target="_blank" rel="noopener noreferrer">
                    { addr.value }
                </a>
                <DeleteOutline/>
            </span>
        )
    }

    job(job) {

        return (
            <div class="job">
                <EditOutlined/>
                <DeleteOutline/>
                { job.is_active
                    ? <PauseOutlined/>
                    : <PlayArrowOutlined/>
                }
                <pre>{ JSON.stringify(job, null, "  ") }</pre>
            </div>
        );

    }

    loadInfos() {

        const {
            addr,
            noContract,
            noDao,
            noRights
        } = this.errors;

        const multicall = `${this.state.addr.value}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`;
        const sputnik = `${this.state.addr.value}.${window.nearConfig.SPUTNIK_V2_FACTORY_ADDRESS}`;

        this.lastAddr = this.state.addr.value;

        noContract.isBad = false;
        noDao.isBad = false;
        noRights.isBad = false;

        if (addr.isBad) {
            noContract.isBad = true;
            noDao.isBad = true;
            noRights.isBad = true;
        }

        this.setState({ loading: true });

        let newState = {};

        Promise.all([
            view(multicall, "get_admins", {})
                .catch(e => {
                    if (e.type === "AccountDoesNotExist" && e.toString().includes(` ${multicall} `))
                        noContract.isBad = true;
                }),
            view(multicall, "get_tokens", {}).catch(e => {}),
            view(multicall, "get_jobs", {}).catch(e => {}),
            view(multicall, "job_get_bond", {}).catch(e => {}),
            view(sputnik, "get_policy", {})
                .catch(e => {
                    if (e.type === "AccountDoesNotExist" && e.toString().includes(` ${sputnik} `))
                        noDao.isBad = true;
                }),
        ])
        .then(([admins, tokens, jobs, bond, policy]) => 
            newState = { 
                infos: {
                    admins: admins,
                    tokens: tokens,
                    jobs: jobs,
                    bond: bond,
                    policy: policy
                },
                loading: false
            }
        )
        .finally(() => {
            // can user propose FunctionCall to DAO?
            const canPropose = newState.infos.policy?.roles
                .filter(r => r.kind === "Everyone" || r.kind.Group.includes(window.WALLET.state.wallet.getAccountId()))
                .map(r => r.permissions)
                .flat()
                .some(permission => {
                    const [proposalKind, action] = permission.split(":")
                    return (proposalKind === "*" || proposalKind === "call") && (action === "*" || action === "AddProposal")
                })

            if ( ! canPropose ) noRights.isBad = true; // no add proposal rights

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

        // error
        const errors = Object.keys(this.errors)
            .map(e => <p key={`p-${e}`}>
                    <span>{ this.errors[e].isBad ? '\u2717' : '\u2714' }  </span>
                    { this.errors[e].message }
                </p>);

        if (Object.keys(this.errors).filter(e => this.errors[e].isBad && e !== "noRights").length > 0)
            return (<>
                <div className="info-container error">
                    <div>{ errors }</div>
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
                <AddOutlined/>
                <h1 className="title">Admins</h1>
                <ul className="list">
                    { infos.admins.map(a => <li>{ this.toLink(a) }</li>) }
                </ul>
            </div>
            <div className="info-card tokens">
                <AddOutlined/>
                <h1 className="title">Tokens</h1>
                <ul className="list">
                    { infos.tokens.map(t => <li>{ this.toLink(t) }</li>) }
                </ul>
            </div>
            <div className="info-card jobs">
                <AddOutlined/>
                <h1 className="title">Jobs</h1>
                <div className="scroll-wrapper">
                    { infos.jobs.map(j => this.job(j)) }
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

        window.STATE = this.state;

        return (
            <div className="dao-container">
                <div className="address-container">
                    <TextInput
                        placeholder="Insert DAO name here"
                        value={ addr }
                        error={ this.errors.addr }
                        update={ () => {
                            this.forceUpdate();
                            setTimeout(() => {
                                if (new Date() - this.lastInput > 400)
                                    this.loadInfos()
                            }, 500)
                            this.lastInput = new Date()
                        } }
                        InputProps={{
                            endAdornment: <InputAdornment position="end">{`.${window.nearConfig.SPUTNIK_V2_FACTORY_ADDRESS}`}</InputAdornment>,
                        }}
                    />
                </div>
                { this.getContent() }
            </div>
        );

    }

}