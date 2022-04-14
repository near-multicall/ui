import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import { Base64 } from 'js-base64';
import React, { Component } from 'react';
import { toGas } from '../../utils/converter';
import { initWallet, tx, view } from '../../utils/wallet';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
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
            bond: "0"
        }

        window.WALLET = initWallet()
            .then(wallet => this.setState({ 
                wallet: wallet,
            }, () => {
                PERSISTENT.setAddresses({
                    user: wallet.getAccountId()
                })
                window.WALLET = this;
                if (wallet.getAccountId() !== "") {
                    const URL = `https://api.${window.ENVIRONMENT === "mainnet" ? "" : "testnet."}app.astrodao.com/api/v1/daos/account-daos/${this.state.wallet.getAccountId()}`;
                    fetch(URL)
                        .then(response => response.json())
                        .then(data => this.daoList = data.map(dao => dao.id))
                        .then(() => this.forceUpdate())
                }
            }));

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
        } = PERSISTENT.addresses

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

        tx(
            dao,
            "add_proposal",
            args,
            toGas(15),
            this.state.bond
        )

    }

    proposeFT(desc, depo, gas, token, amount) {

        const {
            multicall,
            dao
        } = PERSISTENT.addresses

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
                                    receiver_id: PERSISTENT.addresses.multicall, 
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

        tx(
            dao,
            "add_proposal",
            args,
            toGas(15),
            this.state.bond
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

        const multicall = dao.replace(window.nearConfig.SPUTNIK_V2_FACTORY_ADDRESS, window.nearConfig.MULTICALL_FACTORY_ADDRESS);

        Promise.all([
            view(dao, "get_policy", {})
                .catch(e => {

                    if (e.type === "AccountDoesNotExist" && e.toString().includes(` ${dao} `) ||
                        e.type === "CodeDoesNotExist" && e.toString().includes(`${dao}`) ||
                        e.toString().includes("MethodNotFound"))
                        noDao.isBad = true;
                    else
                        console.error(e, {...e})

                    this.setState({ bond: "0" })
                    MENU.forceUpdate()
                    
                }),
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
            .then(([policy, admins]) => {

                if (!policy) return;

                this.setState({
                    bond: policy.proposal_bond
                });

                if (policy.roles
                    .filter(r => r.kind === "Everyone" || r.kind.Group.includes(this.state.wallet.getAccountId()))
                    .filter(r => r.permissions.includes("*:AddProposal") || r.permissions.includes("FunctionCall:AddProposal"))
                    .length === 0) // no add proposal rights
                    noRights.isBad = true;

                MENU.forceUpdate()

            })

    }

    render() {

        const { wallet } = this.state;

        if (!wallet)
            return null;

        return (
            <div
                className="wallet"
            >
                <button
                    onClick={ () => wallet.isSignedIn()
                        ? this.signOut() 
                        : this.signIn()
                    }
                >
                    { window.ENVIRONMENT === "testnet" 
                        ? <ScienceOutlinedIcon/>
                        : <AccountBalanceWalletOutlinedIcon/>
                    }
                    { wallet.isSignedIn()
                        ? wallet.getAccountId()
                        : `Sign in`
                    }
                </button>
                { wallet.isSignedIn()
                    ? <>
                        <span className="for">for</span>
                        <Autocomplete
                            className='dao-selector'
                            freeSolo
                            value={PERSISTENT.addresses.dao}
                            options={this.daoList}
                            renderInput={(params) => 
                                <TextField 
                                    {...params} 
                                    placeholder="Select DAO" 
                                />
                            }
                            onInputChange={(event, newValue) => {
                                PERSISTENT.setAddresses({
                                    dao: newValue ?? "",
                                    multicall: newValue.replace(window.nearConfig.SPUTNIK_V2_FACTORY_ADDRESS, window.nearConfig.MULTICALL_FACTORY_ADDRESS)
                                })
                                setTimeout(() => {
                                    if (new Date() - this.lastInput > 400 && ArgsAccount.isValid(newValue))
                                        this.connectDao(newValue)
                                }, 500)
                                this.lastInput = new Date()
                            }}
                        />
                    </>
                    : <></>
                }
            </div>
        );

    }

}