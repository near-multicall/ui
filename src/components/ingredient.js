import React, { Component } from 'react'
import './../global.scss'

export default class Ingredient extends Component {

    constructor(addr, func, args, gas, depo) {

        super();

        this.state = {
            addr: addr,
            func: func,
            args: args,
            gas: gas,
            depo: depo
        };

    }

    render() {

        return (

            <div className="ingredient">
            </div>
        
        );

    }

}