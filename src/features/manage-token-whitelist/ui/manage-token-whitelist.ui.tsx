import { CancelOutlined, DeleteOutlined, EditOutlined, SettingsBackupRestoreOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { Form, Formik, FormikHelpers } from "formik";
import { HTMLProps, useCallback, useEffect, useState } from "react";
import { InferType } from "yup";

import { args } from "../../../shared/lib/args/args";
import { MulticallSettingsChange, MulticallTokenWhitelistDiffKey } from "../../../shared/lib/contracts/multicall";
import { Tooltip } from "../../../shared/ui/design";
import { TextField } from "../../../shared/ui/form";
import { MulticallInstance } from "../../../entities";

import "./manage-token-whitelist.ui.scss";

const _ManageTokenWhitelist = "ManageTokenWhitelist";

type FormState = Pick<MulticallSettingsChange, MulticallTokenWhitelistDiffKey>;

interface ManageTokenWhitelistUIProps extends Omit<HTMLProps<HTMLDivElement>, "onChange"> {
    onEdit: (payload: FormState) => void;
    resetTrigger: { subscribe: (callback: EventListener) => () => void };
}

interface FormStates extends Record<keyof FormState, Set<MulticallSettingsChange[keyof FormState][number]>> {}

export const ManageTokenWhitelistUI = ({ disabled, onEdit, resetTrigger }: ManageTokenWhitelistUIProps) => {
    const [editModeEnabled, editModeSwitch] = useState(false);

    const fungibleTokenSchema = args.object().shape({
        address: args.string().lowercase().address().default(""),
    });

    type FungibleTokenSchema = InferType<typeof fungibleTokenSchema>;

    const [included, include] = useState<FormStates["addTokens"]>(new Set()),
        [discarded, discard] = useState<FormStates["removeTokens"]>(new Set());

    const onSubmit = useCallback(
        ({ address }: FungibleTokenSchema, { setTouched, setValues }: FormikHelpers<FungibleTokenSchema>) => {
            if (discarded.has(address)) {
                discard((addresses) => (addresses.delete(address) ? new Set(addresses) : addresses));
            } else {
                include((addresses) => (address.length > 0 ? new Set(addresses.add(address)) : addresses));
            }

            setValues(fungibleTokenSchema.getDefault());
            setTouched({});
        },

        [discard, discarded, include]
    );

    const onDiscard = useCallback(
        ({ address }: FungibleTokenSchema) => {
            if (included.has(address)) {
                include((addresses) => (addresses.delete(address) ? new Set(addresses) : addresses));
            } else {
                discard((addresses) =>
                    addresses.delete(address) ? new Set(addresses) : new Set(addresses.add(address))
                );
            }
        },

        [discard, include, included]
    );

    const onReset = useCallback(() => {
        include(new Set());
        discard(new Set());
        editModeSwitch(false);
    }, [editModeSwitch, include, discard]);

    useEffect(() => resetTrigger.subscribe(onReset), [onReset, resetTrigger]);

    useEffect(
        () => onEdit({ addTokens: Array.from(included), removeTokens: Array.from(discarded) }),
        [discarded, included, onEdit]
    );

    return (
        <Formik
            initialValues={fungibleTokenSchema.getDefault()}
            validationSchema={fungibleTokenSchema}
            {...{ onReset, onSubmit }}
        >
            <Form className={_ManageTokenWhitelist}>
                <MulticallInstance.TokenWhitelistTable
                    ItemProps={{
                        idToHighlightColor: (id) =>
                            (included.has(id) && MulticallInstance.SettingsDiffMeta.addTokens.color) ||
                            (discarded.has(id) && MulticallInstance.SettingsDiffMeta.removeTokens.color) ||
                            null,

                        slots: {
                            End: editModeEnabled
                                ? ({ rowId: address }) => (
                                      <IconButton onClick={() => onDiscard({ address } as FungibleTokenSchema)}>
                                          {discarded.has(address) ? (
                                              <SettingsBackupRestoreOutlined fontSize="large" />
                                          ) : (
                                              <DeleteOutlined fontSize="large" />
                                          )}
                                      </IconButton>
                                  )
                                : void null,
                        },
                    }}
                    className={`${_ManageTokenWhitelist}-table`}
                    headerSlots={{
                        end: editModeEnabled ? (
                            <Tooltip content="Cancel & Reset">
                                <IconButton type="reset">
                                    <CancelOutlined />
                                </IconButton>
                            </Tooltip>
                        ) : (
                            <Tooltip content={disabled ? "You are in read-only mode" : "Propose changes"}>
                                <span>
                                    <IconButton
                                        onClick={() => editModeSwitch(true)}
                                        {...{ disabled }}
                                    >
                                        <EditOutlined />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        ),
                    }}
                    itemsAdditional={Array.from(included)}
                    subheader={
                        editModeEnabled ? (
                            <TextField
                                invertedColors
                                fullWidth
                                label="New token address"
                                name="address"
                            />
                        ) : (
                            void null
                        )
                    }
                />
            </Form>
        </Formik>
    );
};
