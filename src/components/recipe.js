import React, { Component } from 'react'
import { Pot } from '../components.js'
import './../global.scss'

export default class Recipe extends Component {

    constructor() {

        super();

        this.state = {
            pots: []
        };

    }
    
    addPot() {
        
        this.setState({ pots: this.state.pots.push(new Pot()) });

    }

    render() {

        const { pots } = this.state;

        return (

            <div className="recipe">
                <div className="stove">
                    <Pot/>
                    <Pot/>
                    <Pot/>
                    <Pot/>
                    { pots }
                </div>
            </div>
        
        );

    }

}