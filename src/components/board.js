import React, { Component } from 'react'
import './../global.scss';
import './board.scss';

export default class Board extends Component {

    constructor(props) {

        super(props);

        this.state = {
            ingredient: null,
            data: null,
            newData: null
        };

    }

    componentDidMount() {

        window.BOARD = this;

    }
    
    open(ingredient) {

        FRIDGE.close();

        const ingrendientData = ingredient.getData();

        this.setState({ 
            ingredient: ingredient,
            data: ingrendientData,
            newData: ingrendientData
        }, () => console.log(this.state));
        
    }

    close(save = true) {

        if (!save) {
            this.setState({ 
                ingredient: null,
                data: null,
                newData: null
            });
            return;
        }
        
        const { ingredient, newData } = this.state;

        ingredient.set(newData);

        // console.log(newData);
        
        this.setState({ 
            ingredient: null,
            data: null,
            newData: null
        });

    }

    setNewData(key, newVal) {

        if (!this.state.ingredient)
            return;

        const { newData } = this.state;

        // console.log("setting newData for", key);
    
        if (key.substr(-1) == "]") { // Array

            // console.log("interpreted as Array");
            eval(`newData.${key} = newVal`);

        } else if (key.includes(".")) { // JSON

            // console.log("interpreted as JSON");
            eval(`newData.${key}.value = newVal`);

        } else {

            // console.log("interpreted as Attribute");
            newData[key].value = newVal;

        }

    }

    createInput(name, key, data) {

        const {
            type,
            value,
            min,
            max,
            unit
        } = data;

        const inputType = {
            "Number": "number",
            "String": "text",
            "BigInt": "number"
        }

        let inputContainer, 
            inputs;
        
        switch (type) {

            case "JSON-String":
                inputContainer = <div className="input-container" key={ key }>
                    { name && <span className="name">{ name }</span> }
                    <textarea 
                        className="themed-input"
                        defaultValue={ value }
                        onChange={ e => BOARD.setNewData(key, e.target.value) }
                    ></textarea>
                </div>
            break;

            case "JSON":
                inputs = [];
                for (let v in value)
                    inputs.push(this.createInput(v, `${key}.value.${v}`, value[v]))

                inputContainer = <div className="input-container indent-children" key={ key }>
                    <span className="name">{ name }</span>
                    { inputs }
                </div>
            break;

            case "Array":
                inputs = [];
                for (let i = 0; i < value.length; i++)
                    inputs.push(this.createInput(null, `${key}.value[${i}]`, { type: unit, value: value[i] }))
                
                inputContainer = <div className="input-container indent-children" key={ key }>
                    <span className="name">{ name }</span>
                    { inputs }
                </div>
            break;

            default:
                inputContainer = <div className="input-container" key={ key }>
                    { name && <span className="name">{ name }</span> }
                    <input
                        className="themed-input"
                        type={ inputType[type] } 
                        defaultValue={ value }
                        min={ min ? min.toString() : -Infinity }
                        max={ max ? max.toString() : Infinity }
                        onChange={ e => BOARD.setNewData(key, e.target.value) }
                    ></input>
                    { unit && <span className="unit">{ unit }</span> }
                </div>
            break;

        }

        return inputContainer;

    }

    createEditor() {

        const { data } = this.state;

        return <>
            { this.createInput("Contract adress", "addr", data["addr"]) }
            { this.createInput("Function name", "func", data["func"]) }
            { this.createInput("Function arguments", "args", data["args"]) }
            { this.createInput("Allocated gas", "gas", data["gas"]) }
            { this.createInput("Attached deposit", "depo", data["depo"]) }
        </>;

    }

    render() {

        const { ingredient } = this.state;

        return ingredient !== null ? (

            <>
                <div className="board">
                    {/* Editable Title */}
                    { this.createEditor() }
                    <div className="button-container">
                        <button onClick={ () => this.close(true) }>Save</button>
                        <button onClick={ () => this.close(false) }>Close</button>
                    </div>
                </div>
            </>

        ) : <></>;

    }

}