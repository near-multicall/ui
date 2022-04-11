import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import { Base64 } from 'js-base64';
import React, { Component } from 'react';
import { toGas, toYocto } from '../../utils/converter';
import { initWallet, tx } from '../../utils/wallet';
import './wallet.scss';

export default class Wallet extends Component {

    constructor(props) {

        super(props);

        this.state = {
            wallet: null
        }

        window.WALLET = initWallet()
            .then(wallet => this.setState({ 
                wallet: wallet 
            }, () => {
                window?.LAYOUT?.setAddresses({
                    user: this.state.wallet.getAccountId()
                })
                window.WALLET = this;
            }));

    }

    then(func) { return new Promise(resolve => resolve(func())) } // mock promise

    signIn() {

        this.state.wallet.requestSignIn();

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
        } = LAYOUT.state.addresses

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
        } = LAYOUT.state.addresses

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
                                    receiver_id: LAYOUT.state.addresses.multicall, 
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

        console.log(window.ENVIRONMENT);

        return (
            <>
                <button
                    className="wallet"
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
                        ? `Logout ${wallet.getAccountId()}`
                        : `Sign in`
                    }
                </button>
            </>
        );

    }

}