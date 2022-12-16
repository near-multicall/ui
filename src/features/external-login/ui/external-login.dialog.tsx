import { InfoOutlined } from "@mui/icons-material";
import clsx from "clsx";
import { ComponentProps, useMemo, useReducer } from "react";

import { ArgsError, ArgsString } from "../../../shared/lib/args-old";
import { STORAGE } from "../../../shared/lib/persistent";
import { Validation } from "../../../shared/lib/validation";
import { Dialog, TextInput, Tooltip } from "../../../shared/ui/design";
import { ModuleContext } from "../module-context";

import "./external-login.dialog.scss";

interface ELDialogProps extends Pick<ComponentProps<typeof Dialog>, "className" | "onClose" | "open" | "title"> {
    method: "dao" | "multicall";
}

const _ELDialog = "ELDialog";

export const ELDialog = ({ className, method, onClose, open, title }: ELDialogProps) => {
    const dAppURL = useMemo(() => new ArgsString(""), []);

    const URLInvalid = ArgsError.useInstance("Invalid URL", Validation.isUrl, true);

    const [requestURL, requestURLUpdate] = useReducer<(currentValue: string, input: string) => string>(
        (currentValue, value) => {
            if (URLInvalid.$detected) {
                return currentValue;
            } else {
                const url = new URL(value);
                url.searchParams.set("account_id", STORAGE.addresses[method]);
                url.searchParams.set("public_key", ModuleContext.keys.public);
                url.searchParams.set("all_keys", ModuleContext.keys.all);
                return url.toString();
            }
        },
        ""
    );

    return (
        <Dialog
            className={clsx(_ELDialog, className)}
            doneRename="Proceed"
            noSubmit={URLInvalid.$detected}
            onSubmit={() => window.open(requestURL, "_blank")}
            {...{ onClose, open, title }}
        >
            <ul className={`${_ELDialog}-stepByStepGuide`}>
                {ModuleContext.stepByStepGuide.map((step) => (
                    <li key={step.text}>
                        <span>
                            {step.text}

                            {step.hint && (
                                <Tooltip
                                    content={step.hint}
                                    placement="right"
                                >
                                    <InfoOutlined />
                                </Tooltip>
                            )}
                        </span>
                    </li>
                ))}
            </ul>

            <TextInput
                className="light-textfield"
                error={URLInvalid.instance}
                label="dApp URL"
                update={({ target }) => requestURLUpdate(target.value)}
                value={dAppURL}
                variant="filled"
            />
        </Dialog>
    );
};
