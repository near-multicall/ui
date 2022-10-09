import { DateTime } from "luxon";
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { DateTimePicker as MaterialUIPicker } from "@mui/x-date-pickers/DateTimePicker";

function DateTimePicker({
    label,
    value,
    minDateTime,
    maxDateTime,
    handleChange,
}: {
    label: string;
    value: Date;
    minDateTime: Date;
    maxDateTime: Date;
    handleChange: (value: DateTime | null, keyboardInputValue: string | undefined) => void;
}) {
    return (
        <LocalizationProvider dateAdapter={AdapterLuxon}>
            <MaterialUIPicker
                label={label}
                minDateTime={DateTime.fromJSDate(minDateTime)}
                maxDateTime={DateTime.fromJSDate(maxDateTime)}
                value={DateTime.fromJSDate(value)}
                onChange={handleChange}
                renderInput={(params) => <TextField {...params} />}
            />
        </LocalizationProvider>
    );
}

export { DateTimePicker };
