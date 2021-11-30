import React, { Component } from 'react'
import { ArgsAccount, ArgsBig, ArgsJSON, ArgsNumber, ArgsString } from '../utils/args';
import Call from '../utils/call';
import { toGas } from '../utils/converter';
import './base.scss';

export default class BaseTask extends Component {

    uniqueClassName = "base-task";
    call;

    constructor(json = null) {
       
        super();

        this.state = {
            showArgs: false
        };

        this.init(json);

    }

    init(json = null) {

        this.call = new Call({
            name: new ArgsString(json?.name ?? "Custom"),
            addr: new ArgsAccount(json?.addr ?? "lennczar.near"),
            func: new ArgsString(json?.func ?? ""),
            args: new ArgsJSON(json?.args ? JSON.stringify(json.args) : '{}'),
            gas: new ArgsNumber(json?.gas ?? 0, 1, toGas(300), "gas"),
            depo: new ArgsBig(json?.depo ?? "0", "0", null, "yocto")
        });

    }

    render() {

        const {
            name,
            addr,
            func,
            args,
            gas,
            depo
        } = this.call;

        const { showArgs } = this.state;

        return (
            <div 
                className={`task-container ${this.uniqueClassName}`}
            >
                <div className="name">
                    <h3>{ name.toString() }</h3> 
                    - 
                    <a>edit</a>
                </div>
                <div className="data-container">
                    <p><span>Contract address</span><a className="code" href={ addr.toUrl() } target="_blank" rel="noopener noreferrer">{ addr.toString() }</a></p>
                    <p><span>Function name</span><span className="code">{ func.toString() }</span></p>
                    <p className="expandable"><span>Function arguments</span>{ 
                        showArgs
                        ? <a onClick={ () => this.setState({ showArgs: false }) } >hide</a>
                        : <a onClick={ () => this.setState({ showArgs: true }) } >show</a>
                    }</p>
                    { showArgs && <pre className="code">{ args.toString() }</pre> }
                    <p><span>Allocated gas</span><span className="code">{ gas.toString() } <span>{ gas.getUnit() }</span></span></p>
                    <p><span>Attached deposit</span><span className="code">{ depo.toString() }  <span>{ depo.getUnit() }</span></span></p>
                </div>
            </div>
        );

    }

}