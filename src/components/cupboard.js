import React, { Component } from 'react'
import './../global.scss'

export default class Cupboard extends Component {

    constructor(props) {

        super(props);

        this.state = {
            pot: null
        };

    }

    componentDidMount() {

        window.CUPBOARD = this;

    }
    
    open(newPot) {

        this.setState(
            { pot: newPot }, 
            () => this.close("","","","","")
        );

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

        const { pot } = this.state;

        return pot !== null ? (

            <div className="cupboard">
       
            </div>

        ) : <></>;

    }

}