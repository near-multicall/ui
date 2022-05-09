import React, { Component } from 'react';
import TextField from '@mui/material/TextField';

class TextInput extends Component {

    render() {

        const {
            label,
            value,
            error,
            update,
            ...props
        } = this.props;

        const errors = Array.isArray(error)
            ? error
            : [error] // works with undefined too

        return (
        <TextField
            label={label}
            value={value.value}
            margin="dense"
            size="small"
            onChange={(e) => {
                value.value = e.target.value;
                errors.forEach(e => e?.validOrNull(value));
                update?.(e);
            }}
            error={errors.some(e => e?.isBad)}
            helperText={errors.map(e => {
                if (e?.isBad)
                    return e?.message
            })}
            InputLabelProps={{ shrink: true }}
            {...props}
        />
        );

    }

}

class TextInputWithUnits extends Component {

    render() {
  
    const {
        label,
        value,
        error,
        options,
        update,
        textProps,
        unitProps,
        ...props
    } = this.props;

    const errors = Array.isArray(error)
        ? error
        : [error] // works with undefined too
  
        return (
            <div className="unitInput">
                <TextField
                    label={label}
                    value={
                        errors.map(e => {
                            if (e !== undefined)
                                return e.validOrNull(value) || e.intermediate
                        })[0] ?? value
                    }
                    margin="dense"
                    size="small"
                    onChange={(e) => {
                        value.value = e.target.value;
                        errors.forEach(e => e?.validOrNull(value));
                        update?.(e);
                    }}
                    error={errors.some(e => e?.isBad)}
                    helperText={errors.map(e => {
                        if (e?.isBad)
                            return e?.message
                    })}
                    InputLabelProps={{ shrink: true }}
                    {...textProps}
                    {...props}
                />
                <TextField
                    label="Unit"
                    value={ value.unit }
                    margin="dense"
                    size="small"
                    select
                    onChange={e => {
                        value.unit = e.target.value;
                        errors.forEach(e => e?.validOrNull(value));
                        update?.(e);
                    }}
                    SelectProps={{
                        native: true,
                    }}
                    InputLabelProps={{ shrink: true }}
                    {...unitProps}
                    {...props}
                >
                    { options.map((o) => (
                        <option key={o} value={o}>
                            {o}
                        </option>
                    )) }
                </TextField>
            </div>
        );
  
    }

}

export { TextInput, TextInputWithUnits }