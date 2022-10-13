import { TextField } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";

import {
    DateTimePicker as GenericDateTimePicker,
    type DateTimePickerProps as GenericDateTimePickerProps,
} from "@mui/x-date-pickers/DateTimePicker";

import { DateTime } from "luxon";

import "./date-time-picker.scss";

export interface DateTimePickerProps
    extends Omit<
        GenericDateTimePickerProps<DateTime, DateTime>,
        "onChange" | "maxDateTime" | "minDateTime" | "renderInput" | "value"
    > {
    handleChange: (value: DateTime | null, keyboardInputValue: string | undefined) => void;
    maxDateTime: Date;
    minDateTime: Date;
    value: Date;
}

export const DateTimePicker = ({ value, minDateTime, maxDateTime, handleChange, ...props }: DateTimePickerProps) => (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
        <GenericDateTimePicker
            ampm={false}
            minDateTime={DateTime.fromJSDate(minDateTime)}
            maxDateTime={DateTime.fromJSDate(maxDateTime)}
            value={DateTime.fromJSDate(value)}
            onChange={handleChange}
            renderInput={(params) => <TextField {...params} />}
            {...props}
        />
    </LocalizationProvider>
);
