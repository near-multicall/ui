import { TextField } from "@mui/material";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import {
    DateTimePicker as GenericDateTimePicker,
    type DateTimePickerProps as GenericDateTimePickerProps,
} from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import clsx from "clsx";
import { DateTime } from "luxon";

import "./date-time-picker.scss";

export interface DateTimePickerProps
    extends Omit<
        GenericDateTimePickerProps<DateTime, DateTime>,
        "onChange" | "maxDateTime" | "minDateTime" | "renderInput" | "value"
    > {
    classes?: { root?: string; modal?: string; input?: string };
    handleChange: (value: DateTime | null, keyboardInputValue: string | undefined) => void;
    maxDateTime: Date;
    minDateTime: Date;
    value: Date;
}

export const DateTimePicker = ({
    classes,
    handleChange,
    maxDateTime,
    minDateTime,
    value,
    ...props
}: DateTimePickerProps) => (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
        <GenericDateTimePicker
            PaperProps={{ classes: { root: clsx("DateTimePicker-modal", classes?.modal) } }}
            className={clsx("DateTimePicker", classes?.root)}
            ampm={false}
            minDateTime={DateTime.fromJSDate(minDateTime)}
            maxDateTime={DateTime.fromJSDate(maxDateTime)}
            value={DateTime.fromJSDate(value)}
            onChange={handleChange}
            renderInput={(params) => (
                <TextField
                    {...params}
                    className={clsx("DateTimePicker-input", classes?.input)}
                />
            )}
            {...props}
        />
    </LocalizationProvider>
);
