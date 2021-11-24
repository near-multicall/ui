import React, { Component } from 'react'
import { Pot } from '../components.js'
import './../global.scss'
import './layout.scss'

export default class Layout extends Component {
    
    constructor(props) {

        super(props);

        this.state = {
            pots: [<Pot className="add-pot" key={ 0 } potid={ 0 }/>],
            multicall: {
                "schedules": []
            }
        };

    }

    componentDidMount() {

        window.LAYOUT = this;

    }
    
    addPot() {
        
        const { multicall } = this.state;

        multicall.schedules.push([]);

        const newPot = <Pot
            key={ this.state.pots.length }
            potid={ this.state.pots.length }
        />;

        this.setState({ 
            pots: [...this.state.pots, newPot],
            multicall: multicall
        });

    }

    // delete(ingredient) {

    //     const { pots } = this.state;
    //     const pos = ingredient.getPos();

    //     console.log("pot to delete from", pots[pos.potID]);

    //     pots[pos.potID].setPotID(pos.potID);
    //     pots[pos.potID].deleteIngredient(pos.ingredientID);

    // }

    // deletePot(potID) {

    //     const { pots } = this.state;

    //     pots.splice(potID, 1);

    //     for (let i = potID + 1; i < pots.length; i++)
    //         pots[i].setPotID(i - 1);

    //     this.setState({ pots : pots });

    // }

    updateMulticall(ingredient) {

        const { multicall } = this.state;
        const pos = ingredient.getPos();
        
        console.log(pos);
        console.log("got data", ingredient.toJSON());
        multicall.schedules[pos.potID][pos.ingredientID] = ingredient.toJSON();

        this.setState({ multicall: multicall });

    }
    
    cook() {

        console.log(this.state.multicall);
        console.log(JSON.stringify(this.state.multicall));

    }

    render() {

        const { pots } = this.state;

        return (

            <div className="layout">

                <div className="dnd-container">
                    { pots }
                </div>
        
            </div>

        );

    }

}