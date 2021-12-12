import React, { Component } from 'react';
import './export.scss';

export default class Export extends Component {

    componentDidMount() {

        window.EXPORT = this;

    }

    render() {

        return (
            <div 
                value={2}
                className="tab-panel"
            >
                hello
            </div>
        );

    }

}