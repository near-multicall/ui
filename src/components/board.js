import React, { Component } from 'react'
import './../global.scss';
import './board.scss';

export default class Board extends Component {

    constructor(props) {

        super(props);

        this.state = {
            ingredient: null,
            data: null
        };

    }

    componentDidMount() {

        window.BOARD = this;

    }
    
    open(ingredient) {

        FRIDGE.close();

        this.setState({ 
            ingredient: ingredient,
            data: ingredient.getData()
        }, () => console.log(this.state));
        
    }

    close(save = true) {

        if (!save) {
            this.setState({ 
                ingredient: null,
                data: null,
            });
            return;
        }
        
        const { ingredient, data } = this.state;

        ingredient.set(data);
        
        this.setState({ 
            ingredient: null,
            data: null
        });

    }

    createInput(name, data) {

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

            case "JSON":
                inputs = [];
                for (let key in value)
                    inputs.push(this.createInput(key, value[key]))

                inputContainer = <div className="input-container indent-children">
                    <span className="name">{ name }</span>
                    { inputs }
                </div>
            break;

            case "Array":
                inputs = [];
                for (let val of value)
                    inputs.push(this.createInput(null, { type: unit, value: val }))

                inputContainer = <div className="input-container indent-children">
                    <span className="name">{ name }</span>
                    { inputs }
                </div>
            break;

            default:
                inputContainer = <div className="input-container">
                    { name && <span className="name">{ name }</span> }
                    <input
                        className="themed-input"
                        placeholder={ value } 
                        type={ inputType[type] } 
                        min={ min ? min.toString() : -Infinity }
                        max={ max ? max.toString() : Infinity }
                    />
                    { unit && <span className="unit">{ unit }</span> }
                </div>
            break;

        }

        return inputContainer;

    }

    createEditor() {

        const { data } = this.state;

        return <>
            { this.createInput("Contract adress", { type: "String", value: data["addr"] }) }
            { this.createInput("Function name", { type: "String", value: data["func"] }) }
            { this.createInput("Function arguments", { type: "JSON", value: data["args"] }) }
            { this.createInput("Allocated gas", data["gas"]) }
            { this.createInput("Attached deposit", data["depo"]) }
        </>;

    }

    render() {

        const { ingredient, data } = this.state;

        return ingredient !== null ? (

            <>
                <div className="board">
                    {/* Editable Title */}
                    { this.createEditor() }
                    <div className="button-container">
                        <button onClick={ () => this.close() }>Save</button>
                        <button onClick={ () => this.close() }>Close</button>
                    </div>
                </div>
            </>

        ) : <></>;

    }

}