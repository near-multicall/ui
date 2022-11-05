import clsx from "clsx";
import { useField } from "formik";
import React, { useEffect, useState } from "react";
import "./choice-field.scss";

const _ChoiceField = "ChoiceField";

type Options = {
    ids: number[];
    choose: (id: number) => void;
    add: (id: number) => void;
    remove: (id: number) => void;
    toggle: (id: number) => void;
    isActive: (id: number) => boolean;
};

type ChoiceFieldProps = {
    children: (options: Options) => React.ReactNode;
    show: (ids: number[]) => React.ReactNode;
    name: string;
    initial?: number[];
    roundtop?: boolean;
    roundbottom?: boolean;
};

export const ChoiceField = ({ roundbottom, roundtop, children, show, initial, name, ...props }: ChoiceFieldProps) => {
    const [field, meta, helper] = useField(name);
    const [ids, setIds] = useState<number[]>(initial ?? []);
    useEffect(() => {
        helper.setValue(ids);
    }, [ids]);
    const choose = (id: number) => setIds((prevIds) => [id]);
    const add = (id: number) => setIds((prevIds) => [...prevIds, id]);
    const remove = (id: number) => setIds((prevIds) => prevIds.filter((x) => x !== id));
    const toggle = (id: number) => (ids.includes(id) ? remove(id) : add(id));
    const isActive = (id: number) => ids.includes(id);
    return (
        <div
            className={clsx(_ChoiceField, {
                roundtop: roundtop,
                roundbottom: roundbottom,
            })}
        >
            <div className={clsx(`${_ChoiceField}-input`)}>
                {children({ ids, choose, add, remove, toggle, isActive })}
            </div>
            <div className={clsx(`${_ChoiceField}-content`)}>{show(ids)}</div>
        </div>
    );
};
