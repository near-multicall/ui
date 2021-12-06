import React, { Component } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import './editor.scss';

export default class Editor extends Component {

    constructor(props) {

        super(props);

        this.state = {
            editing: null
        }

    }

    componentDidMount() {

        window.EDITOR = this;

    }

    edit(task) {

        this.setState({editing: task});

    }

    render() {

        const { editing } = this.state;

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