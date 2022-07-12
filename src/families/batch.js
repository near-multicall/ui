import React, { Component } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Task } from '../components.js'
import './batch.scss';
import './base.scss';

export default class BatchTask extends Component {

    call;
    options = {};
    errors;

    tasks;

    constructor(props) {

        super(props);

        this.state = {
            showArgs: false
        }

    }

    onAddressesUpdated() {}

    render() {

        console.log(this.props.id);

        this.tasks = LAYOUT.state.columns[this.props.id].taskIds.map(taskId => LAYOUT.state.tasks[taskId]);

        return (
            <fieldset className="task-container batch-container">
                <legend className="name">
                    Batch
                </legend>
                <Droppable 
                    droppableId={this.props.id}
                    type="task"
                >
                    { provided => (
                        <div 
                            className="tasks-wrapper"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            { this.tasks.map((task, index) => <Task key={task.id} task={task} index={index} json={task.json}/>) }
                            { provided.placeholder }
                        </div>
                    ) }
                </Droppable>
            </fieldset>
        )

    }

}