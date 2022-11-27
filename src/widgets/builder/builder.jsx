import debounce from "lodash.debounce";
import { Component } from "react";
import { Droppable } from "react-beautiful-dnd";
import { TextField } from "../../shared/ui/form";
import { Column } from "../column/column.jsx";
import { keywords } from "../../entities/task/config/keywords";
import { Formik, Form } from "formik";
import "./builder.scss";

const normalize = (str) => str.replace("_", " ").replace("-", " ").toLowerCase();

const _Builder = "Builder";
export class Builder extends Component {
    resolveDebounced = debounce((resolve) => resolve(), 400);

    constructor(props) {
        super(props);
        this.state = {
            searchTerm: "",
            tasks: this.props.layout.getColumns()["menu"].taskIds.map((taskId) => this.props.layout.getTasks()[taskId]),
        };
    }

    componentDidMount() {
        document.addEventListener("onlayoutupdated", (e) => {
            this.setState({
                tasks: this.filterTasks(
                    e.detail.columns["menu"].taskIds.map((taskId) => e.detail.tasks[taskId]),
                    this.state.searchTerm
                ),
            });
        });
    }

    filterTasks(tasks, searchTerm) {
        return tasks.filter((task) => {
            return (
                searchTerm === "" ||
                (keywords[task.family]?.[task.func] ?? [])
                    .concat(task.family, task.func)
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
                        this.setState({
                            searchTerm: values.search,
                            tasks: this.filterTasks(
                                menuColumn.taskIds.map((taskId) => LAYOUT.getTasks()[taskId]),
                                values.search
                            ),
                        });
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
                                    tasks={menuColumn.taskIds.map((taskId) => LAYOUT.getTasks()[taskId])}
                                    show={this.state.tasks.map((task) => task.id)}
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
