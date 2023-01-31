import { InfoOutlined, PreviewOutlined } from "@mui/icons-material";
import clsx from "clsx";
import { ComponentProps, useMemo, useReducer } from "react";

import { ArgsError, ArgsString } from "../../shared/lib/args-old";
import { STORAGE } from "../../shared/lib/persistent";
import { Validation } from "../../shared/lib/validation";
import { Dialog, PopupMenu, TextInput, Tooltip } from "../../shared/ui/design";
import { ExtAuthParams } from "./ext-auth.params";
import { ExtAuthService } from "./ext-auth.service";

import "./ext-auth.ui.scss";

interface IExtAuthDialog extends Pick<ComponentProps<typeof Dialog>, "className" | "onClose" | "open" | "title"> {
    method: "dao" | "multicall";
}

export const ExtAuthDialog = ({ className, method, onClose, open, title }: IExtAuthDialog) => {
    const dAppURL = useMemo(() => new ArgsString(""), []);

    const URLInvalid = ArgsError.useInstance("Invalid URL", Validation.isUrl, true);

    const [requestURL, requestURLUpdate] = useReducer<(currentValue: string, input: string) => string>(
        (currentValue, value) => {
            if (URLInvalid.$detected) {
                return currentValue;
            } else {
                const url = new URL(value);
                url.searchParams.set("account_id", STORAGE.addresses[method]);
                url.searchParams.set("public_key", ExtAuthParams.keys.public);
                url.searchParams.set("all_keys", ExtAuthParams.keys.all);
                return url.toString();
            }
        },
        ""
    );

    return (
        <Dialog
            className={clsx("ExtAuthDialog", className)}
            doneRename="Proceed"
            noSubmit={URLInvalid.$detected}
            onSubmit={() => window.open(requestURL, "_blank")}
            {...{ onClose, open, title }}
        >
            <ul className="ExtAuthDialog-stepByStepGuide">
                {ExtAuthParams.stepByStepGuide.map((step) => (
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

export const ExtAuthDialogs = (): JSX.Element => {
    const { dialogsVisibility, closeHandlerBinding } = ExtAuthService.useDialogsState();

    return (
        <>
            {Object.values(ExtAuthParams.methods).map((loginMethod) => (
                <ExtAuthDialog
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

interface IExtAuthMenu extends Pick<ComponentProps<typeof PopupMenu>, "triggerClassName"> {
    FeatureFlags: {
        ExternalAuth: Record<keyof typeof ExtAuthParams.methods, boolean>;
    };
}

export const ExtAuthMenu = ({ FeatureFlags, triggerClassName }: IExtAuthMenu) => (
    <PopupMenu
        icon={<PreviewOutlined />}
        items={Object.values(ExtAuthParams.methods).map(({ title, type }) => ({
            disabled: !FeatureFlags.ExternalAuth[type],
            key: type,
            onClick: () => ExtAuthService.dialogOpenRequested(type),
            title,
        }))}
        {...{ triggerClassName }}
    />
);
