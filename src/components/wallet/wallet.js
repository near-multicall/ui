import React, { Component } from 'react';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';import { initWallet } from '../../utils/wallet';
import './wallet.scss';

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
            }, () => window?.LAYOUT?.setAddresses({
                user: this.state.wallet.getAccountId()
            })));

    }

    signIn() {

        this.state.wallet.requestSignIn("multicall.near");

    }
    
    signOut() {

        this.state.wallet.signOut();
        this.forceUpdate();
    
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