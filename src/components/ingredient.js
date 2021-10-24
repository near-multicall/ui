import React, { Component } from 'react'
import './../global.scss'

export default class Ingredient extends Component {

    constructor(props) {

        super(props);

        this.state = {
            ...props
        };

    }

    set(state) {

        this.setState(state);

    }

    render() {

        return (

            <div className="ingredient-pseudo">
                <div 
                    className="ingredient"
                    { ...this.props }
                >
                </div>
            </div>
        
        );

    }

}