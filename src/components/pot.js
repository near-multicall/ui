import React, { Component } from 'react'
import { Ingredient } from '../components.js'
import './../global.scss'

export default class Pot extends Component {

    constructor(props) {

        super(props);

        this.state = {
            ingredients: [],
            ...props
        };

    }

    componentDidUpdate() {

        console.log(this.state);

    }
    
    addIngredient(addr, func, args, gas, depo) {

        const newIngredient = <Ingredient
            key={ this.state.ingredients.length }    
            addr={ addr }
            func={ func }
            args={ args }
            gas={ gas }
            depo={ depo }
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

                        if (CUPBOARD !== undefined)
                            CUPBOARD.open(this);
                    
                    } }
                /> 
            </div>
        
        );

    }

}