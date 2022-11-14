import { InfoOutlined } from "@mui/icons-material";
import clsx from "clsx";
import { ComponentProps, useCallback, useMemo, useReducer, useState } from "react";

import { ArgsError, ArgsString } from "../../../shared/lib/args-old";
import { STORAGE } from "../../../shared/lib/persistent";
import { Validation } from "../../../shared/lib/validation";
import { Dialog, TextInput, Tooltip } from "../../../shared/ui/components";
import { DappLoginConfig as Config } from "../config";
import { DappLoginDialogsModel } from "../model/dapp-login-dialogs";

import "./dapp-login-dialog.scss";

interface DappLoginDialogProps extends Pick<ComponentProps<typeof Dialog>, "className" | "onClose" | "open" | "title"> {
    method: "dao" | "multicall";
}

const _DappLoginDialog = "DappLoginDialog";

const DappLoginDialog = ({ className, method, onClose, open, title }: DappLoginDialogProps) => {
    const dAppURL = useMemo(() => new ArgsString(""), []);

    const URLInvalid = ArgsError.useInstance("Invalid URL", Validation.isUrl, true);

    const [requestURL, requestURLUpdate] = useReducer<(currentValue: string, input: string) => string>(
        (currentValue, value) => {
            if (URLInvalid.$detected) {
                return currentValue;
            } else {
                const url = new URL(value);
                url.searchParams.set("account_id", STORAGE.addresses[method]);
                url.searchParams.set("public_key", Config.KEYS.public);
                url.searchParams.set("all_keys", Config.KEYS.all);
                return url.toString();
            }
        },
        ""
    );

    return (
        <Dialog
            className={clsx(_DappLoginDialog, className)}
            doneRename="Proceed"
            noSubmit={URLInvalid.$detected}
            onSubmit={() => window.open(requestURL, "_blank")}
            {...{ onClose, open, title }}
        >
            <ul className={`${_DappLoginDialog}-stepByStepGuide`}>
                {Config.STEP_BY_STEP_GUIDE.map((step) => (
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

export const DappLoginDialogs = () => {
    const { dialogsVisibility, closeHandlerBinding } = DappLoginDialogsModel.useVisibilityState();

    return Object.values(Config.METHODS).map((loginMethod) => (
        <DappLoginDialog
            key={loginMethod.type}
            method={loginMethod.type}
            onClose={closeHandlerBinding(loginMethod.type)}
            open={dialogsVisibility[loginMethod.type]}
            {...loginMethod}
        />
    ));
};
