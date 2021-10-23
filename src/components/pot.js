import React, { Component } from 'react'
import { Ingredient } from '../components.js'
import './../global.scss'

export default class Pot extends Component {

    constructor() {

        super();

        this.state = {
            ingredients: []
        };

    }
    
    addIngredient(addr, func, args, gas, depo) {

        this.setState({
            ingredients: this.state.ingredients.push(new Ingredient(addr, func, args, gas, depo))
        });

    }

    render() {

        const { ingredients } = this.state;

        return (

            <div className="pot">
                <Ingredient/>
                <Ingredient/>
                <Ingredient/>
                <Ingredient/>
                <Ingredient/>
                { ingredients }
            </div>
        
        );

    }

}