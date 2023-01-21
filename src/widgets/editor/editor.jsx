import React, { Component } from "react";
import hash from "object-hash";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import { Formik } from "formik";
import "./editor.scss";

export class Editor extends Component {
    constructor(props) {
        super(props);

        this.state = {
            editingID: null,
        };
    }

    componentDidMount() {
        window.EDITOR = this;
    }

    edit(taskID) {
        this.setState({ editingID: taskID });
        window.TASKS.forEach((t) => t.instance.current.onEditFocus(taskID));
    }

    render() {
        const { editingID } = this.state;

        const editing = window?.TASKS?.find((t) => t.id === editingID)?.instance.current;
        const keyObj = {
            card: editingID,
            formData: editing?.state.formData,
        };

        return editing ? (
            <Formik
                initialValues={editing.state.formData}
                validate={(values) => editing.validateForm(values)}
                onSubmit={() => {}}
                key={hash(keyObj, { algorithm: "md5", encoding: "base64" })}
            >
                <>
                    <editing.Editor />
                    {/* <h1>
                        {editing.state.formData.name}, {editingID}
                    </h1> */}
                </>
            </Formik>
        ) : (
            <div className="placeholder">
                <AutoAwesomeOutlinedIcon className="huge-icon" />
                <h3>
                    Click the <EditOutlinedIcon className="icon" /> icon in the top right corner of a task to start
                    editing!
                </h3>
            </div>
        );
    }
}
