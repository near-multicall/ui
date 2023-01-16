import { Component } from "react";
import "./docs.scss";

export class DocsPage extends Component {
    render() {
        return (
            <iframe
                className="DocsPage"
                src="https://docs.multicall.app"
            />
        );
    }
}
