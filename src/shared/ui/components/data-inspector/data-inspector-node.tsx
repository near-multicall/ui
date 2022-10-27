import { ObjectName, ObjectPreview, ObjectRootLabel, ObjectValue } from "react-inspector";

interface ObjectLabelProps {
    data: string | object;
    isNonenumerable: boolean;
    name: string;
}

export const ObjectLabel = ({ name, data, isNonenumerable = false }: ObjectLabelProps) => (
    <span>
        {typeof name === "string" ? (
            <ObjectName
                dimmed={isNonenumerable}
                {...{ name }}
            />
        ) : (
            <ObjectPreview data={name} />
        )}

        <span>{": "}</span>
        {Object.keys(data).length === 0 ? Array.isArray(data) ? "[]" : "{}" : <ObjectValue object={data} />}
    </span>
);

interface DataInspectorNodeProps extends ObjectLabelProps {
    depth: number;
    expanded: boolean;
}

export const DataInspectorNode = ({ depth, name, data, isNonenumerable, expanded }: DataInspectorNodeProps) =>
    depth === 0 ? <ObjectRootLabel {...{ data, name }} /> : <ObjectLabel {...{ data, isNonenumerable, name }} />;
