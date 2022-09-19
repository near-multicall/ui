import React from "react";

enum fieldType {
    NORMAL,
}

const NormalField = ({ value, onChange }: React.HTMLProps<HTMLInputElement>) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
    />
    // TODO add error text
);

export { fieldType, NormalField };
