import { CancelOutlined, DeleteOutlined, EditOutlined, SettingsBackupRestoreOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { Form, Formik, FormikHelpers } from "formik";
import { HTMLProps, useCallback, useEffect, useState } from "react";
import { InferType } from "yup";

import { args } from "../../../shared/lib/args/args";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { Tooltip } from "../../../shared/ui/design";
import { TextField } from "../../../shared/ui/form";
import { MulticallInstance } from "../../../entities";

import "./manage-token-whitelist.ui.scss";

const _ManageTokenWhitelist = "ManageTokenWhitelist";

type MITokenWhitelistDiff = Pick<
    Arguments<typeof Multicall["configDiffToProposalActions"]>[0],
    "addTokens" | "removeTokens"
>;

interface ManageTokenWhitelistUIProps extends Omit<HTMLProps<HTMLDivElement>, "onChange"> {
    onEdit: (diff: MITokenWhitelistDiff) => void;
    resetTrigger: { subscribe: (callback: EventListener) => () => void };
}

export const ManageTokenWhitelistUI = ({ disabled, onEdit, resetTrigger }: ManageTokenWhitelistUIProps) => {
    const [editModeEnabled, editModeSwitch] = useState(false);

    const schema = args.object().shape({
        address: args.string().ft().default(""),
    });

    type Schema = InferType<typeof schema>;

    const [included, include] = useState<Set<MITokenWhitelistDiff["addTokens"][number]>>(new Set()),
        [discarded, discard] = useState<Set<MITokenWhitelistDiff["removeTokens"][number]>>(new Set());

    const onSubmit = useCallback(
        ({ address }: Schema, { setTouched, setValues }: FormikHelpers<Schema>) => {
            if (discarded.has(address)) {
                discard((addresses) => (addresses.delete(address) ? new Set(addresses) : addresses));
            } else {
                include((addresses) => (address.length > 0 ? new Set(addresses.add(address)) : addresses));
            }

            setValues(schema.getDefault());
            setTouched({});
        },

        [discard, discarded, include]
    );

    const onDiscard = useCallback(
        ({ address }: Schema) => {
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
            initialValues={schema.getDefault()}
            validationSchema={schema}
            {...{ onReset, onSubmit }}
        >
            <Form className={_ManageTokenWhitelist}>
                <MulticallInstance.TokenWhitelistTable
                    ItemProps={{
                        idToHighlight: (id) =>
                            (included.has(id) && MulticallInstance.SettingsDiffMeta.addTokens.color) ||
                            (discarded.has(id) && MulticallInstance.SettingsDiffMeta.removeTokens.color) ||
                            null,

                        slots: {
                            End: editModeEnabled
                                ? ({ rowId: address }) => (
                                      <IconButton onClick={() => onDiscard({ address } as Schema)}>
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
                    className={`${_ManageTokenWhitelist}-controls`}
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
