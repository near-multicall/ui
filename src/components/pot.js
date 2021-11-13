import React, { Component } from 'react'
import { Ingredient } from '../components.js'
import './../global.scss'
import './pot.scss'

export default class Pot extends Component {

    constructor(props) {

        super(props);

        this.state = {
            ingredients: [],
            ...props
        };

    }
    
    addIngredient(prefab) {

        const newIngredient = <Ingredient
            key={ this.state.ingredients.length }    
            prefab={ prefab }
        />;

        this.setState({
            ingredients: [...this.state.ingredients, newIngredient]
        });

    }

    getIngredients() {

        return this.state.ingredients;

    }

    render() {

        const { ingredients } = this.state;

        return (

            <div className="pot">
                { ingredients }
                <Ingredient
                    className="add-ingredient ingredient"
                    onClick={ () => {

                        if (FRIDGE !== undefined)
                            FRIDGE.open(this);
                    
                    } }
                /> 
            </div>
        
        );

    }

}