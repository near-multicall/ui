import * as React from "react";
import { DateTime } from "luxon";
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { DateTimePicker as MaterialUIPicker } from "@mui/x-date-pickers/DateTimePicker";

function DateTimePicker() {
    const [value, setValue] = React.useState<DateTime | null>(DateTime.local());

    const handleChange = (newValue: DateTime | null) => {
        setValue(newValue);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterLuxon}>
            <MaterialUIPicker
                label="Date&Time picker"
                value={value}
                onChange={handleChange}
                renderInput={(params) => <TextField {...params} />}
            />
        </LocalizationProvider>
    );
}

export { DateTimePicker };
