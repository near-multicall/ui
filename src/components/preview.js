import React, { Component } from 'react'
import * as icons from '../icons.js'
import './../global.scss';
import './preview.scss';

import * as prefabsImport from '../prefabs.json';
const prefabs = prefabsImport.default;

export default class Preview extends Component {

    constructor(props) {

        super(props);

        this.state = {
            prefab: props.prefab
        };

    }

    static getAll() {

        const allPreviews = [];

        for (let i in prefabs.ingredients)
            allPreviews.push(<Preview
                key={ i }    
                prefab={ prefabs.ingredients[i] }
            />)

        return allPreviews;

    }

    toIngredient() {
        
    }

    render() {

        const { prefab } = this.state;

        return (

            <div 
                className="preview"
                style={{ backgroundColor: prefab.color, backgroundImage: prefab.color }}
                onClick={ () => FRIDGE.close(prefab) }
            >
                <div className="icon-container">
                    <img src={ icons[prefab.icon] } />
                </div>
                <span className="info">{ prefab.info }</span>
                <span className="name">{ prefab.name }</span>          
            </div>

        );

    }

}