import React, { Component } from 'react'
import { Preview } from '../components.js'
import './../global.scss';
import './fridge.scss';

export default class Fridge extends Component {

    constructor(props) {

        super(props);

        this.state = {
            pot: null,
            previews: null
        };

    }

    componentDidMount() {

        window.FRIDGE = this;

    }
    
    open(newPot) {

        BOARD.close(false);

        this.setState({ 
            pot: newPot,
            previews: this.state.previews || Preview.getAll()
        });
        
    }

    close(prefab) {

        if (!prefab) {
            this.setState({ pot: null });
            return;
        }
        
        const { pot } = this.state;

        if (RECIPE && pot.getIngredients().length === 0)
            RECIPE.addPot(pot);

        pot.addIngredient(prefab);
        
        this.setState({ pot: null });

    }

    render() {

        const { pot, previews } = this.state;

        return pot !== null ? (

            <>
                <div className="fridge">
                    { previews }
                    <button onClick={ () => this.close() }>Close</button>
                </div>
            </>

        ) : <></>;

    }

}