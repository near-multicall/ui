import React, { Component } from 'react'
import { Pot } from '../components.js'
import './../global.scss'
import './recipe.scss'

export default class Recipe extends Component {
    
    constructor(props) {

        super(props);

        this.state = {
            pots: [<Pot className="add-pot" key="0"/>]
        };

    }

    componentDidMount() {

        window.RECIPE = this;

    }
    
    addPot() {
        
        const newPot = <Pot
            key={ this.state.pots.length }
        />;

        this.setState({ 
            pots: [...this.state.pots, newPot] 
        });

    }

    render() {

        const { pots } = this.state;

        return (

            <div className="recipe">

                <div className="stove">
                    { pots }
                </div>
        
            </div>

        );

    }

}