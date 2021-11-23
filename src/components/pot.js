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
            ingredientid={ this.state.ingredients.length }
            potid={ this.state.potid }  
            prefab={ prefab }
        />;

        this.setState({
            ingredients: [...this.state.ingredients, newIngredient]
        });

    }

    getIngredients() {

        return this.state.ingredients;

    }

    // deleteIngredient(ingredientID) {

    //     const { ingredients } = this.state;

    //     if (ingredients.length <= 1)
    //         RECIPE.deletePot(this.state.potid);

    //     ingredients.splice(ingredientID, 1);

    //     for (let i = ingredientID + 1; i < ingredients.length; i++)
    //         ingredients[i].setIngredientID(i - 1);

    //     this.setState({ ingredients: ingredients });

    // }

    // setPotID(ID) {

    //     this.setState({ potid: ID });

    // }

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
                    key={ -1 }
                    ingredientid={ -1 }
                    potid={ this.state.potid }
                />
            </div>
        
        );

    }

}