import clsx from "clsx";
import { useField } from "formik";
import React, { useEffect, useState } from "react";
import "./choice-field.scss";

type Options = {
    ids: string[];
    choose: (id: string) => void;
    add: (id: string) => void;
    remove: (id: string) => void;
    toggle: (id: string) => void;
    isActive: (id: string) => boolean;
};

type ChoiceFieldProps = {
    children: (options: Options) => React.ReactNode;
    show: (ids: string[]) => React.ReactNode;
    name: string;
    initial?: string[];
    roundtop?: boolean;
    roundbottom?: boolean;
};

export const ChoiceField = ({ roundbottom, roundtop, children, show, initial, name }: ChoiceFieldProps) => {
    const [field, meta, helper] = useField(name);
    const [ids, setIds] = useState<string[]>(initial ?? []);
    useEffect(() => {
        helper.setValue(ids);
    }, [ids]);
    const choose = (id: string) => setIds((prevIds) => [id]);
    const add = (id: string) => setIds((prevIds) => [...prevIds, id]);
    const remove = (id: string) => setIds((prevIds) => prevIds.filter((x) => x !== id));
    const toggle = (id: string) => (ids.includes(id) ? remove(id) : add(id));
    const isActive = (id: string) => ids.includes(id);
    return (
        <div
            className={clsx("ChoiceField", {
                roundtop,
                roundbottom,
            })}
        >
            <div className="ChoiceField-input">{children({ ids, choose, add, remove, toggle, isActive })}</div>
            <div className="ChoiceField-content">{show(ids)}</div>
        </div>
    );
};
