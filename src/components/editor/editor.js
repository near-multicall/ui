import React, { Component } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import './editor.scss';
import { Menu } from '@mui/material';

export default class Editor extends Component {

    constructor(props) {

        super(props);

        this.state = {
            editingID: null
        }

    }

    componentDidMount() {

        window.EDITOR = this;

    }

    edit(taskID) {

        this.setState({editingID: taskID});
        MENU.grow();

    }

    render() {

        const { editingID } = this.state;

        const editing = window?.TASKS?.find(t => t.id === editingID)?.instance.current;

        return (
            <div 
                value={1}
                className="tab-panel"
            >
                { editing
                ? <>{ editing.renderEditor() }</>
                : <div className="placeholder">
                    <AutoAwesomeOutlinedIcon className="huge-icon" />
                    <h3>Click the <EditOutlinedIcon className="icon" /> icon in the top right corner of a task to start editing!</h3>
                </div> }
            </div>
        );

    }

}