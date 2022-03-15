import { DeleteOutline, EditOutlined, AddOutlined, PauseOutlined, PlayArrowOutlined } from '@mui/icons-material';
import React, { Component } from 'react';
import { ArgsAccount, ArgsError } from '../../utils/args';
import { toNEAR } from '../../utils/converter';
import { view } from '../../utils/wallet';
import { TextInput } from '../editor/elements';
import './dao.scss';



export default class Dao extends Component {

    errors = {
        addr: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), !ArgsAccount.isValid(window?.LAYOUT?.state?.addresses?.dao ?? "")),
        isSputnik: new ArgsError("We currently only support Sputnik (v2) DAOs", value => value.value.endsWith("." + window.nearConfig.SPUTNIK_V2_FACTORY_ADDRESS)),
        noContract: new ArgsError("No multicall instance found at address", value => this.errors.noContract.isBad, true),
        noMethod: new ArgsError("No multicall instance found at address", value => this.errors.noMethod.isBad),
    }

    constructor(props) {

        super(props);

        this.state = {
            addr: new ArgsAccount(window?.LAYOUT?.state?.addresses?.dao ?? ""),
            loading: false,
            infos: {
                admins: [],
                tokens: [],
                jobs: [],
                bond: "..."
            }
        }

    }

    // sputnikToMulticall(sputnik) {

    //     const base = sputnik.value.split("." + window.nearConfig.SPUTNIK_V2_FACTORY_ADDRESS)[0];
    //     return new ArgsAccount(`${base}.${window.nearConfig.MULTICALL_FACTORY_ADDRESS}`);

    // }

    // toLink(address) {

    //     const addr = new ArgsAccount(address);

    //     return (
    //         <span>
    //             <a href={ addr.toUrl() } target="_blank" rel="noopener noreferrer">
    //                 { addr.value }
    //             </a>
    //             <DeleteOutline/>
    //         </span>
    //     )
    // }

    // job(job) {

    //     console.log(job);
    //     return (
    //         <div class="job">
    //             <EditOutlined/>
    //             <DeleteOutline/>
    //             { job.is_active
    //                 ? <PauseOutlined/>
    //                 : <PlayArrowOutlined/>
    //             }
    //             <pre>{ JSON.stringify(job, null, "  ") }</pre>
    //         </div>
    //     );

    // }

    // loadInfos() {

    //     const {
    //         noContract,
    //         noMethod
    //     } = this.errors;

    //     const multicall = this.sputnikToMulticall(this.state.addr)
        
    //     if (!ArgsAccount.isValid(multicall)) {
    //         this.forceUpdate();
    //         return;
    //     }

    //     noContract.isBad = false;
    //     noMethod.isBad = false;

    //     this.setState({ loading: true });

    //     Promise.all([
    //         view(multicall.value, "get_admins", {}),
    //         view(multicall.value, "get_tokens", {}),
    //         view(multicall.value, "get_jobs", {}),
    //         view(multicall.value, "job_get_bond", {})
    //     ])
    //     .then(([admins, tokens, jobs, bond]) => this.setState(
    //         { 
    //             infos: {
    //                 admins: admins,
    //                 tokens: tokens,
    //                 jobs: jobs,
    //                 bond: bond
    //             },
    //             loading: false
    //         }
    //     ))
    //     .catch(e => {
    //         if (e.type === "AccountDoesNotExist")
    //             noContract.isBad = true;
    //         else if (e.toString().includes("MethodNotFound"))
    //             noMethod.isBad = true;
    //         else
    //             console.error(e)

    //         this.setState({ loading: false });
    //     })

    // }

    getContent() {

        const {
            infos,
            loading,
        } = this.state;

        // error
        for (let e in this.errors)
            if (this.errors[e].isBad)
                return <div className="info-container error">
                    { this.errors[e].message }
                </div>

        // loading ...
        if (loading) 
            return <div className="info-container loader"></div>

        // infos found
        return <div className="info-container">
            <div className="info-card admins">
                <AddOutlined/>
                <h1 className="title">Admins</h1>
                <ul className="list">
                    {/* { infos.admins.map(a => <li>{ this.toLink(a) }</li>) } */}
                </ul>
            </div>
            <div className="info-card tokens">
                <AddOutlined/>
                <h1 className="title">Tokens</h1>
                <ul className="list">
                    {/* { infos.tokens.map(t => <li>{ this.toLink(t) }</li>) } */}
                </ul>
            </div>
            <div className="info-card jobs">
                <AddOutlined/>
                <h1 className="title">Jobs</h1>
                <div className="scroll-wrapper">
                    {/* { infos.jobs.map(j => this.job(j)) } */}
                </div>
            </div>
            <div className="info-card bond">
                <h1 className="title">Job Bond
                    <span>{`${toNEAR(infos.bond)} Ⓝ`}</span>
                </h1>
            </div>
        </div>

    }

    render() {

        const { addr } = this.state;

        this.errors.isSputnik.validOrNull(addr);

        return (
            <div className="dao-container">
                <div className="address-container">
                    <TextInput
                        value={ addr }
                        error={ this.errors.addr }
                        // update={ () => this.loadInfos() }
                    />
                </div>
                { this.getContent() }
            </div>
        );

    }

}