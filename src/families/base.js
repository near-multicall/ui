import React, { Component } from 'react'
import './base.scss';

export default class BaseTask extends Component {

    render() {

        return (
            <div className="task-container">
                { this.props.children }
            </div>
        );

    }

}