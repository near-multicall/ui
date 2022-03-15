import React, { Component } from 'react';
import { TextField } from '@mui/material';

class TextInput extends Component {

  render() {

    const {
        label,
        value,
        error,
        update,
        ...props
    } = this.props;

    return (
      <TextField
        label={label}
        value={ 
            value.value
            // error !== undefined 
            //     ? error.validOrNull(value)?.value || error.intermediate?.value
            //     : value.value
        }
        margin="dense"
        size="small"
        // onChange={(e) => {
        //     value.value = e.target.value;
        //     error?.validOrNull(value);
        //     update?.(e);
        // }}
        // error={error?.isBad}
        // helperText={error?.isBad && error?.message}
        InputLabelProps={{ shrink: true }}
        // {...props}
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
  
      return (
        <div className="unitInput">
            <TextField
                label={label}
                value={ 
                    error !== undefined 
                        ? error.validOrNull(value) || error.intermediate 
                        : value
                    }
                margin="dense"
                size="small"
                onChange={(e) => {
                    value.value = e.target.value;
                    error?.validOrNull(value);
                    update?.(e);
                }}
                error={error?.isBad}
                helperText={error?.isBad && error?.message}
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
                    error?.validOrNull(value);
                    update?.(e);
                }}
                SelectProps={{
                    native: true,
                }}
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