import { ThumbUpSharp } from '@mui/icons-material';
import { TextField } from '@mui/material';
import React, { Component } from 'react';
import { ArgsAccount, ArgsError } from '../../utils/args';
import { TextInput } from '../editor/elements';
import './dao.scss';

export default class Dao extends Component {

    errors = {
        addr: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), !ArgsAccount.isValid(window?.LAYOUT?.state?.addresses?.dao ?? ""))
    }

    constructor(props) {

        super(props);

        this.state = {
            addr: new ArgsAccount(window?.LAYOUT?.state?.addresses?.dao ?? "")
        }

    }

    render() {

        const { addr } = this.state

        return (
            <div className="dao-wrapper">
                <div className="dao-container">
                    <TextInput
                        value={ addr }
                        error={ this.errors.addr }
                        update={ () => this.forceUpdate() }
                    />
                </div>
            </div>
        );

    }

}