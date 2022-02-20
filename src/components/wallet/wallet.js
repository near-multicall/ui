import React, { Component } from 'react';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { initWallet, tx } from '../../utils/wallet';
import './wallet.scss';
import { toGas, toYocto } from '../../utils/converter';
import { Base64 } from 'js-base64';

export default class Wallet extends Component {

    constructor(props) {

        super(props);

        this.state = {
            wallet: null
        }

    }

    componentDidMount() {

        initWallet()
            .then(wallet => this.setState({ 
                wallet: wallet 
            }, () => {
                window?.LAYOUT?.setAddresses({
                    user: this.state.wallet.getAccountId()
                })
                window.WALLET = this;
            }));

    }

    signIn() {

        this.state.wallet.requestSignIn(ENVIRONMENT === "mainnet" ? "multicall.near" : "multicall.testnet");

    }
    
    signOut() {

        this.state.wallet.signOut();
        LAYOUT.forceUpdate();
    
    }

    propose(depo, gas) {

        const {
            multicall,
            dao
        } = LAYOUT.state.addresses

        const args = {
            proposal: {
                description: "multicall [ID] [Link]",
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

    proposeFT(depo, gas, token, amount) {

        const {
            multicall,
            dao
        } = LAYOUT.state.addresses

        const args = {
            proposal: {
                description: "multicall [ID] [Link]",
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

        return (
            <button
                className="wallet"
                onClick={ () => wallet.isSignedIn()
                    ? this.signOut() 
                    : this.signIn()
                }
            >
                <AccountBalanceWalletOutlinedIcon/>
                { wallet.isSignedIn()
                    ? `Logout ${wallet.getAccountId()}`
                    : `Sign in`
                }
            </button>
        );

    }

}