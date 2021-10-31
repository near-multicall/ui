import { diffEpochValidators } from 'near-api-js/lib/validators';
import React, { Component } from 'react'
import './../global.scss'

export default class Ingredient extends Component {

    constructor(props) {

        super(props);

        this.state = {
            addr: null,
            func: null,
            args: null,
            gas: null,
            depo: null,
            showArgs: false
        };

    }

    componentDidMount() {

        if (this.props?.className?.includes("add-ingredient"))
            return;

        if (!this.props?.prefab) {
            console.error("props or prefab missing in ingredient");
            return;
        }

        this.setState({
            ...this.props.prefab
        }, () => console.log(this.state));

    }

    set(state) {

        this.setState(state);

    }

    getAllArgs() {

        const { args } = this.state;

        let allArgs = [];
        for (let arg in args)
            allArgs.push(<p key={ arg }><span>{ arg }</span><span className="code">{ args[arg].value }</span></p>);

        return allArgs;

    }

    render() {

        const {
            color,
            name,
            addr,
            func,
            gas,
            depo,
            showArgs
        } = this.state;

        return (

            <div className="ingredient-pseudo">
                <div 
                    className="ingredient"
                    style={{ backgroundColor: color, backgroundImage: color }}
                    { ...this.props }
                >
                    { this.props.prefab && 
                        <>
                            <h3>{ name }</h3><a onClick={ () => EDITOR.open(this) }>edit</a>
                            <div>
                                <p><span>Contract address</span><span className="code">{ addr }</span></p>
                                <p><span>Function name</span><span className="code">{ func }</span></p>
                                <p className="expandable"><span>Function arguments</span>{ 
                                    showArgs 
                                    ? <>
                                        <a onClick={ () => this.setState({ showArgs: false }) } >hide</a>
                                        { this.getAllArgs() }
                                    </>
                                    : <a onClick={ () => this.setState({ showArgs: true }) } >show</a>
                                }</p>
                                <p><span>Allocated gas</span><span className="code">{ gas?.value }</span></p>
                                <p><span>Attached deposit</span><span className="code">{ depo?.value }</span></p>
                            </div>
                        </> 
                    }
                </div>
            </div>
        
        );

    }

}