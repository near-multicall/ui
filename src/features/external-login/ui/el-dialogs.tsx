import { InfoOutlined } from "@mui/icons-material";
import clsx from "clsx";
import { ComponentProps, useMemo, useReducer } from "react";

import { ArgsError, ArgsString } from "../../../shared/lib/args-old";
import { STORAGE } from "../../../shared/lib/persistent";
import { Validation } from "../../../shared/lib/validation";
import { Dialog, TextInput, Tooltip } from "../../../shared/ui/design";
import { ModuleContext } from "../context";
import { ELDialogsModel } from "../model/el-dialogs";

import "./el-dialog.scss";

interface ExternalLoginDialogProps
    extends Pick<ComponentProps<typeof Dialog>, "className" | "onClose" | "open" | "title"> {
    method: "dao" | "multicall";
}

const _ExternalLoginDialog = "ExternalLoginDialog";

const ExternalLoginDialog = ({ className, method, onClose, open, title }: ExternalLoginDialogProps) => {
    const dAppURL = useMemo(() => new ArgsString(""), []);

    const URLInvalid = ArgsError.useInstance("Invalid URL", Validation.isUrl, true);

    const [requestURL, requestURLUpdate] = useReducer<(currentValue: string, input: string) => string>(
        (currentValue, value) => {
            if (URLInvalid.$detected) {
                return currentValue;
            } else {
                const url = new URL(value);
                url.searchParams.set("account_id", STORAGE.addresses[method]);
                url.searchParams.set("public_key", ModuleContext.KEYS.public);
                url.searchParams.set("all_keys", ModuleContext.KEYS.all);
                return url.toString();
            }
        },
        ""
    );

    return (
        <Dialog
            className={clsx(_ExternalLoginDialog, className)}
            doneRename="Proceed"
            noSubmit={URLInvalid.$detected}
            onSubmit={() => window.open(requestURL, "_blank")}
            {...{ onClose, open, title }}
        >
            <ul className={`${_ExternalLoginDialog}-stepByStepGuide`}>
                {ModuleContext.STEP_BY_STEP_GUIDE.map((step) => (
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

export const ELDialogs = (): JSX.Element => {
    const { dialogsVisibility, closeHandlerBinding } = ELDialogsModel.useVisibilityState();

    return (
        <>
            {Object.values(ModuleContext.METHODS).map((loginMethod) => (
                <ExternalLoginDialog
                    key={loginMethod.type}
                    method={loginMethod.type}
                    onClose={closeHandlerBinding(loginMethod.type)}
                    open={dialogsVisibility[loginMethod.type]}
                    {...loginMethod}
                />
            ))}
        </>
    );
};
