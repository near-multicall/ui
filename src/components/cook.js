import React, { Component } from 'react'
import './../global.scss';
import './cook.scss';

export default class Cook extends Component {

    constructor(props) {

        super(props);

        this.state = {
            json: null
        };

    }
    
    render() {

        const { json } = this.state;

        return json !== null ? (

            <></>

        ) : (
        
            <button 
                className="cook-button"
                onClick={ () => RECIPE.cook() }    
            >
                Cook
            </button>
            
        );

    }

}