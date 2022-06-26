import { Base64 } from 'js-base64';
import React, { Component } from 'react';
import { toGas } from '../../utils/converter';
import { initNear, tx, view } from '../../utils/wallet';
import { SputnikDAO, ProposalKind, ProposalAction } from '../../utils/contracts/sputnik-dao';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Icon } from '@mui/material';
import './wallet.scss';
import { ArgsAccount, ArgsError } from '../../utils/args';

export default class Wallet extends Component {

    errors = {
        noDao: new ArgsError(`No sputnik dao found at address`, value => this.errors.noDao.isBad),
        noRights: new ArgsError("No permission to create a proposal on this dao", value => this.errors.noRights),
        noContract: new ArgsError("Dao does not have a multicall instance", value => this.errors.noContract.isBad),
    }

    daoList = [];

    lastInput;

    constructor(props) {

        super(props);

        this.state = {
            wallet: null,
            currentDAO: new SputnikDAO(STORAGE.addresses?.dao ?? ""),
            expanded: {
                user: false,
                dao: false || (STORAGE.addresses.dao === "")
            }
        }

        window.WALLET = initNear()
            .then( wallet => this.setState({
                    wallet: wallet,
                }, () => {
                    STORAGE.setAddresses({ user: wallet.getAccountId() })
                    window.WALLET = this;
                    if (wallet.getAccountId() !== "") {
                        const URL = `https://api.${window.NEAR_ENV === "mainnet" ? "" : "testnet."}app.astrodao.com/api/v1/daos/account-daos/${this.state.wallet.getAccountId()}`;
                        fetch(URL)
                            .then(response => response.json())
                            .then(data => this.daoList = data.map(dao => dao.id))
                            .then(() => this.forceUpdate())
                    }
                }
            ));

    }

    then(func) { return new Promise(resolve => resolve(func())) } // mock promise

    signIn() {

        this.state.wallet.requestSignIn()

    }
    
    signOut() {

        this.state.wallet.signOut();
        LAYOUT.forceUpdate();
        this.forceUpdate();

    }

    propose(desc, depo, gas) {

        const {
            multicall,
            dao
        } = STORAGE.addresses

        const args = {
            proposal: {
                description: desc,
                kind: {
                    FunctionCall: {
                        receiver_id: multicall,
                        actions: [
                            {
                                method_name: "multicall",
                                args: Base64.encode(JSON.stringify({ calls: LAYOUT.toBase64() })),
                                deposit: `${depo}`,
                                gas: `${gas}`
                            }
                        ]
                    }
                }
            }
        }

        const { proposal_bond } = this.state.currentDAO.policy;

        tx(
            dao,
            "add_proposal",
            args,
            toGas("15"),
            proposal_bond
        )

    }

    proposeFT(desc, depo, gas, token, amount) {

        const {
            multicall,
            dao
        } = STORAGE.addresses

        const args = {
            proposal: {
                description: desc,
                kind: {
                    FunctionCall: {
                        receiver_id: token,
                        actions: [
                            {
                                method_name: "ft_transfer_call",
                                args: Base64.encode(JSON.stringify({
                                    receiver_id: STORAGE.addresses.multicall, 
                                    amount: amount,
                                    msg: JSON.stringify({
                                        function_id: "multicall",
                                        args: Base64.encode(JSON.stringify({"calls":LAYOUT.toBase64()}).toString())
                                    }).toString()
                                })),
                                deposit: `${depo}`,
                                gas: `${gas}`
                            }
                        ]
                    }
                }
            }
        }

        const { proposal_bond } = this.state.currentDAO.policy;

        tx(
            dao,
            "add_proposal",
            args,
            toGas("15"),
            proposal_bond
        )

    }

    connectDao(dao) {

        const {
            noDao,
            noRights,
            noContract
        } = this.errors;

        noRights.isBad = false;
        noDao.isBad = false;
        noContract.isBad = false;

        const multicall = dao.replace(SputnikDAO.FACTORY_ADDRESS, window.nearConfig.MULTICALL_FACTORY_ADDRESS);

        Promise.all([
            SputnikDAO.init(dao).catch(e => {}),
            view(multicall, "get_admins", {})
                .catch(e => {

                    if (e.type === "AccountDoesNotExist" && e.toString().includes(` ${multicall} `) ||
                        e.type === "CodeDoesNotExist" && e.toString().includes(`${multicall}`) ||
                        e.toString().includes("MethodNotFound"))
                        noContract.isBad = true;
                    else
                        console.error(e, {...e})

                    MENU.forceUpdate()

                })
        ])
            .then(([initializedDAO, admins]) => {

                if (!initializedDAO.ready) {
                    noDao.isBad = true;
                    MENU.forceUpdate()
                    return;
                }

                this.setState({
                    currentDAO: initializedDAO
                });

                // can user propose FunctionCall to DAO?
                const canPropose = initializedDAO.checkUserPermission(
                    window.account.accountId,
                    ProposalAction.AddProposal,
                    ProposalKind.FunctionCall
                );

                if ( ! canPropose ) noRights.isBad = true; // no add proposal rights

                MENU.forceUpdate()

            })
            .finally(() => {

                let color = "red";

                if (ArgsAccount.isValid(dao) && !noDao.isBad)
                    color = "yellow";

                if (!noContract.isBad)
                    color = "";

                this.setState({color: color});

            })

    }

    toggleExpandedDao() {

        const { expanded } = this.state;

        this.setState({
            expanded: {
                user: expanded.user,
                dao: !expanded.dao
            }
        })

    }

    toggleExpandedUser() {

        const { expanded } = this.state;

        this.setState({
            expanded: {
                user: !expanded.user,
                dao: expanded.dao
            }
        })

    }

    render() {

        const { wallet, expanded, color } = this.state;

        if (!wallet)
            return null;

        return (
            <div
                className="wallet"
            >
                <div className="user" expand={ expanded.user || !wallet.isSignedIn() ? "yes" : "no" }>
                    <Icon 
                        className="icon" 
                        onClick={() => this.toggleExpandedUser() }
                    >
                        { expanded.user && wallet.isSignedIn()  ? "chevron_left" : "person" }
                    </Icon>
                    <div className="peek">
                        { wallet.getAccountId() }
                    </div>
                    <div className="expand">
                        { wallet.isSignedIn()
                            ? <>
                                { wallet.getAccountId() } 
                                <button 
                                    className="logout" 
                                    onClick={ () => this.signOut() }
                                >
                                    sign out
                                </button>
                              </>
                            : <button onClick={ () => this.signIn() }>sign in</button>
                        }
                    </div>
                </div>
                <span>for</span>
                <div 
                    className={`dao ${color}`} 
                    expand={ expanded.dao ? "yes" : "no" }
                >
                    <Icon 
                        className="icon" 
                        onClick={() => this.toggleExpandedDao() }
                    >
                        { expanded.dao && STORAGE.addresses.dao !== "" ? "chevron_left" : "groups" }
                    </Icon>
                    <div className="expand">
                        <Autocomplete
                            className='dao-selector'
                            freeSolo
                            value={STORAGE.addresses.dao}
                            options={this.daoList}
                            renderInput={(params) => 
                                <TextField 
                                    {...params} 
                                    placeholder="Select DAO"
                                />
                            }
                            onInputChange={(event, newValue) => {
                                STORAGE.setAddresses({
                                    dao: newValue ?? "",
                                    multicall: newValue.replace(SputnikDAO.FACTORY_ADDRESS, window.nearConfig.MULTICALL_FACTORY_ADDRESS)
                                })
                                setTimeout(() => {
                                    if (new Date() - this.lastInput > 400)
                                        if (ArgsAccount.isValid(newValue))
                                            this.connectDao(newValue);
                                        else
                                            this.setState({color: newValue === "" ? "" : "red"})
                                }, 500)
                                this.lastInput = new Date()
                            }}
                        />
                    </div>
                    <div className="peek">
                        { STORAGE?.addresses?.dao ?? "" }
                    </div>
                </div>
            </div>
        );

    }

}