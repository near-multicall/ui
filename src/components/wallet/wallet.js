import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import { Base64 } from 'js-base64';
import React, { Component } from 'react';
import { toGas, toYocto } from '../../utils/converter';
import { initWallet, tx } from '../../utils/wallet';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import './wallet.scss';

export default class Wallet extends Component {

    daoList = [];

    constructor(props) {

        super(props);

        this.state = {
            wallet: null
        }

        window.WALLET = initWallet()
            .then(wallet => this.setState({ 
                wallet: wallet,
            }, () => {
                PERSISTENT.setAddresses({
                    user: wallet.getAccountId()
                })
                window.WALLET = this;
                const URL = `https://api.${window.ENVIRONMENT === "mainnet" ? "" : "testnet."}app.astrodao.com/api/v1/daos/account-daos/${this.state.wallet.getAccountId()}`;
                fetch(URL)
                    .then(response => response.json())
                    .then(data => this.daoList = data.map(dao => dao.id))
                    .then(() => this.forceUpdate())
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
            toYocto(0.01)
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
            toYocto(0.01)
        )

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
                    }}
                />
            </div>
        );

    }

}