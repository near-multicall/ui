import { TextField } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";

import {
    DateTimePicker as GenericDateTimePicker,
    type DateTimePickerProps as GenericDateTimePickerProps,
} from "@mui/x-date-pickers/DateTimePicker";

import clsx from "clsx";
import { DateTime } from "luxon";

import { DateTimePickerConfig as Config } from "./config";
import "./date-time-picker.scss";

export interface DateTimePickerProps
    extends Omit<
        GenericDateTimePickerProps<DateTime, DateTime>,
        "onChange" | "maxDateTime" | "minDateTime" | "renderInput" | "value"
    > {
    classes?: Record<keyof typeof Config.classes, string>;
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
            PaperProps={{ classes: { root: clsx(Config.classes.modal, classes?.modal) } }}
            className={clsx(Config.classes.root, classes?.root)}
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
