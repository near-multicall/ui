import debounce from "lodash.debounce";
import { Component } from "react";
import { Droppable } from "react-beautiful-dnd";
import { TextField } from "../../shared/ui/form-fields";
import { Column } from "../column/column.jsx";
import { keywords } from "../../initial-data";
import { Formik, Form } from "formik";
import "./builder.scss";

const _Builder = "Builder";
export class Builder extends Component {
    resolveDebounced = debounce((resolve) => resolve(), 400);

    constructor(props) {
        super(props);
        this.allKeywords = [...new Set(Object.values(keywords).flat())];
        this.state = {
            searchTerm: "",
            tasks: this.props.layout.getColumns()["menu"].taskIds.map((taskId) => this.props.layout.getTasks()[taskId]),
        };
    }

    filterTasks(searchTerm) {
        const LAYOUT = this.props.layout;

        const menuColumn = LAYOUT.getColumns()["menu"];
        const menuTasks = menuColumn.taskIds.map((taskId) => LAYOUT.getTasks()[taskId]);

        return menuTasks.filter((task) => {
            const normalize = (str) => str.replace("_", " ").replace("-", " ").toLowerCase();

            return (
                searchTerm === "" ||
                keywords[task.id]
                    .concat(task.addr, task.func)
                    .some((kw) => normalize(kw).includes(normalize(searchTerm)))
            );
        });
    }

    render() {
        const LAYOUT = this.props.layout; // ususally global parameter

        const menuColumn = LAYOUT.getColumns()["menu"];

        return (
            <div className={`${_Builder}`}>
                <Formik
                    initialValues={{ search: this.state.searchTerm }}
                    validate={async (values) => {
                        await new Promise((resolve) => this.resolveDebounced(resolve));
                        this.setState({ searchTerm: values.search, tasks: this.filterTasks(values.search) });
                    }}
                    onSubmit={() => {}}
                >
                    <Form className={`${_Builder}-form`}>
                        <TextField
                            name="search"
                            placeholder="Search"
                            hiddenLabel={true}
                            autoFocus
                            roundtop
                            roundbottom
                        />
                    </Form>
                </Formik>
                <Droppable
                    droppableId="special"
                    type="special"
                >
                    {(provided) => (
                        <div
                            className={`${_Builder}-droppable`}
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            <div className={`${_Builder}-selector`}>
                                <Column
                                    key={"menu"}
                                    column={menuColumn}
                                    tasks={this.state.tasks}
                                    index={LAYOUT.getColumnID()}
                                />
                            </div>
                        </div>
                    )}
                </Droppable>
            </div>
        );
    }
}
