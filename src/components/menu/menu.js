import React, { Component } from 'react'
import { Droppable } from 'react-beautiful-dnd';
import './menu.scss';

export default class Menu extends Component {

    render() {

        return (
            <div className="menu-container">
                <div className="menu-column-wrapper">
                    { this.props.children }
                </div>
                <Droppable
                    droppableId="trash"
                    type="task"
                >
                    { provided => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            DELETE
                            { provided.placeholder }
                        </div>
                    ) }
                </Droppable>
            </div>
        );

    }

}