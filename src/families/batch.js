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

        props.json.actions.map(a => ({
            address: props.json.address,
            actions: [a]            
        }))
            .forEach((j, i) => {
                if (TASKS.find(task => task.id === `${props.id}-${i}`)) return;
                STORAGE.layout.columns[this.props.id].taskIds.push(`${props.id}-${i}`);
                STORAGE.layout.tasks[`${props.id}-${i}`] = { id: `${props.id}-${i}`, addr: "", func: "", json: j }
            })
        STORAGE.setLayout({}); // trigger callbacks

        document.addEventListener('onlayoutupdated', () => this.forceUpdate())

    }

    onAddressesUpdated() {}

    render() {

        this.tasks = STORAGE.layout.columns[this.props.id].taskIds.map(taskId => STORAGE.layout.tasks[taskId]);

        console.log(this.tasks);

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