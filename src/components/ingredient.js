import { thisExpression } from '@babel/types';
import React, { Component } from 'react'
import { Recipe } from '../components';
import './../global.scss'
import './ingredient.scss'

export default class Ingredient extends Component {

    constructor(props) {

        super(props);

        this.state = {
            addr: null,
            func: null,
            args: null,
            gas: null,
            depo: null,
            showArgs: false,
            pos: {
                potID: props.potid,
                ingredientID: props.ingredientid
            }
        };

    }

    componentDidMount() {

        if (this.props?.className?.includes("add-ingredient"))
            return;

        if (!this.props?.prefab) {
            console.error("props or prefab missing in ingredient");
            return;
        }

        console.log("prefab", this.props.prefab);
        this.set(this.props.prefab);

    }

    set(state) {

        this.setState(state, () => RECIPE.updateMulticall(this));

    }

    // setIngredientID(ID) {

    //     this.setState({ ingredientid: ID });

    // }

    toJSON() {

        const {
            addr,
            func,
            args,
            gas,
            depo
        } = this.state;

        return {
            "addr": addr.value,
            "func": func.value,
            "args": this.recursiveToJSON(args),
            "gas": gas.value,
            "depo": depo.value
        }

    }

    recursiveToJSON(args) {

        let json;

        switch (args.type) {

            case "JSON-String":
                
                try {
                    json = JSON.parse(args.value);
                } catch (e) {
                    console.error("invalid JSON format", "\nJSON:", args.value, "\nError:", e);
                }

            break;

            case "JSON": 

                json = {};
                for (let attr in args.value)
                    json[attr] = this.recursiveToJSON(args.value[attr]);

            break;

            default:

                json = args.value;
                
            break;

        }

        return json;

    }

    getData() {

        const {
            name,
            addr,
            func,
            args,
            gas,
            depo
        } = this.state;

        return JSON.parse(JSON.stringify({
            name,
            addr,
            func,
            args,
            gas,
            depo
        }))

    }

    getPos() {

        return this.state.pos;

    }

    getAllArgs() {

        const { args } = this.state;

        let allArgs = [];
        for (let arg in args.value)
            allArgs.push(<p key={ arg }><span>{ arg }</span><span className="code">{ args.value[arg].value }</span></p>);

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
                    { this.props.prefab
                        ? name &&
                            <>
                                <div className="name">
                                    <h3>{ name.value }</h3> 
                                    - 
                                    <a onClick={ () => BOARD.open(this) }>edit</a>
                                    |
                                    <a>delete</a>
                                </div>
                                <div className="data-container">
                                    <p><span>Contract address</span><span className="code">{ addr.value }</span></p>
                                    <p><span>Function name</span><span className="code">{ func.value }</span></p>
                                    <p className="expandable"><span>Function arguments</span>{ 
                                        showArgs 
                                        ? <>
                                            <a onClick={ () => this.setState({ showArgs: false }) } >hide</a>
                                            { this.getAllArgs() }
                                        </>
                                        : <a onClick={ () => this.setState({ showArgs: true }) } >show</a>
                                    }</p>
                                    <p><span>Allocated gas</span><span className="code">{ gas.value }</span></p>
                                    <p><span>Attached deposit</span><span className="code">{ depo.value }</span></p>
                                </div>
                            </> 
                        : <>
                        </>
                    }
                </div>
            </div>
        
        );

    }

}