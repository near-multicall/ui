import React, { Component } from 'react'
import { Preview } from '../components.js'
import './../global.scss';

export default class Cupboard extends Component {

    constructor(props) {

        super(props);

        this.state = {
            pot: null,
            previews: null
        };

    }

    componentDidMount() {

        window.CUPBOARD = this;

    }
    
    open(newPot) {

        this.setState({ 
            pot: newPot,
            previews: this.state.previews || Preview.getAll()
        });

    }

    close(addr, func, args, gas, depo) {
        
        const { pot } = this.state;

        console.log(pot);

        if (RECIPE && pot.getIngredients().length === 0)
            RECIPE.addPot(pot);

        pot.addIngredient(addr, func, args, gas, depo);
        
        this.setState({ pot: null });

    }

    render() {

        const { pot, previews } = this.state;

        console.log(previews);

        return pot !== null ? (

            <div className="cupboard">
                { previews }
            </div>

        ) : <></>;

    }

}