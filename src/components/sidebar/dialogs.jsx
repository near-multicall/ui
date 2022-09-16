import { InfoOutlined } from "@mui/icons-material";
import { TextField } from "@mui/material";
import { Base64 } from "js-base64";
import React, { useMemo, useReducer, useState } from "react";

import { ArgsError, ArgsString } from "../../utils/args";
import { SputnikDAO } from "../../utils/contracts/sputnik-dao";
import { readFile, saveFile } from "../../utils/loader";
import { STORAGE } from "../../utils/persistent";
import { Validation } from "../../utils/validation";
import { Dialog } from "../dialog/dialog";
import { TextInput } from "../editor/elements";
import { Tooltip } from "../tooltip/tooltip.jsx";
import "./dialogs.scss";

const DAPP_LOGIN_INSTRUCTIONS = [
    {
        text: "Open the dApp in another browser tab",
    },
    {
        text: "Log out your account on the dApp",
        hint: "You should not be logged in with any wallet on the other dApp, otherwise this won't work.",
    },
    {
        text: "Copy the dApp's URL",
    },
    {
        text: "Paste the URL in the input field below",
    },
    {
        text: 'Click "Proceed"',
        hint: 'This opens the dApp in a new tab, with a "watch-only" mode. Meaning you cannot sign transactions with it',
    },
];

export const DappLoginDialog = ({ actorType, onClose, open, title }) => {
    const dAppURL = useMemo(() => new ArgsString(""), []);

    const { invalid: dAppURLInvalid, error: dAppURLError } = ArgsError.useReactive(
        "Invalid URL",
        Validation.isUrl,
        true
    );

    const [requestURL, requestURLUpdate] = useReducer((currentValue, event) => {
        if (dAppURLInvalid) {
            return currentValue;
        } else {
            const url = new URL(event.target.value);
            url.searchParams.set("account_id", STORAGE.addresses[actorType]);
            url.searchParams.set("public_key", "ed25519%3ADEaoD65LomNHAMzhNZva15LC85ntwBHdcTbCnZRXciZH");
            url.searchParams.set("all_keys", "ed25519%3A9jeqkc8ybv7aYSA7uLNFUEn8cgKo759yue4771bBWsSr");
            return url.toString();
        }
    });

    return (
        <Dialog
            className="modal-dialog"
            doneRename="Proceed"
            noSubmit={dAppURLInvalid}
            onCancel={() => {}}
            onDone={() => window.open(requestURL, "_blank")}
            {...{ onClose, open, title }}
        >
            <ul className="dapp-login-steps">
                {DAPP_LOGIN_INSTRUCTIONS.map(({ text, hint }) => (
                    <li
                        className="item"
                        key={text}
                    >
                        <span className="content">
                            {text}

                            {hint && (
                                <Tooltip
                                    placement="right"
                                    title={hint}
                                >
                                    <InfoOutlined className="icon" />
                                </Tooltip>
                            )}
                        </span>
                    </li>
                ))}
            </ul>

            <TextInput
                className="light-textfield"
                error={dAppURLError}
                label="dApp URL"
                update={requestURLUpdate}
                value={dAppURL}
                variant="filled"
            />
        </Dialog>
    );
};

export const SaveAsJsonDialog = ({ onClose, open }) => {
    const [fileName, fileNameUpdate] = useState("my-multicall");

    return (
        <Dialog
            className="modal-dialog"
            doneRename="Download"
            onCancel={() => {}}
            onDone={() => saveFile(`${fileName}.json`, [JSON.stringify(LAYOUT.toBase64(), null, 2)])}
            title="Save As JSON"
            {...{ onClose, open }}
        >
            <TextField
                className="light-textfield"
                defaultValue="my-multicall"
                helperText="Please give a name to your multicall"
                label="Multicall title"
                onChange={(event) => fileNameUpdate(event.target.value)}
                variant="filled"
            />
        </Dialog>
    );
};

export const LoadFromJsonDialog = ({ onClose, open }) => {
    const [uploadedFile, uploadedFileUpdate] = useState(null);

    return (
        <Dialog
            className="modal-dialog"
            doneRename="Load"
            noSubmit={uploadedFile === null}
            onCancel={() => {}}
            onDone={() => readFile(uploadedFile, (json) => LAYOUT.fromBase64(json))}
            title="Load From JSON"
            {...{ onClose, open }}
        >
            <input
                accept=".json,application/JSON"
                onChange={(event) => uploadedFileUpdate(event.target.files[0])}
                type="file"
            />

            <b className="warn">Your current multicall will be replaced!</b>
        </Dialog>
    );
};

export const LoadFromProposalDialog = ({ onClose, open }) => {
    const [argsFromProposal, argsFromProposalUpdate] = useState(null),
        proposalURL = useMemo(() => new ArgsString(""), []);

    const { invalid: proposalURLIsInvalid, error: proposalURLError } = ArgsError.useReactive(
        "Invalid URL",
        (urlInput) => !!SputnikDAO.getInfoFromProposalUrl(urlInput.value),
        true
    );

    const { invalid: proposalDoesNotExist, error: proposalExistenceError } = ArgsError.useReactive(
        "The specified URL does not link to a proposal",
        (_urlInput) => proposalExistenceError.isBad
    );

    const onProposalURLUpdate = (_event, textInputComponent) => {
        // don't fetch proposal info from bad URL.
        if (proposalURLError.isBad) {
            proposalExistenceError.isBad = false;
            return;
        }

        const { dao, proposalId } = SputnikDAO.getInfoFromProposalUrl(proposalURL.value);

        // !!! creating SputnikDAO instance must be done using init() to make sure DAO exists
        // on that address. We use constructor here because of previous logic checks.
        const daoObj = new SputnikDAO(dao);

        // fetch proposal info from DAO contract
        daoObj
            .getProposal(proposalId)
            .catch((e) => {
                proposalExistenceError.isBad = true;
                return;
            })
            .then((propOrUndefined) => {
                if (!!propOrUndefined) {
                    let multicallArgs;
                    const currProposal = propOrUndefined.kind?.FunctionCall;

                    const multicallAction = currProposal?.actions.find((action) => {
                        // is it normal multicall?
                        if (action.method_name === "multicall") {
                            multicallArgs = JSON.parse(Base64.decode(action.args));
                            return true;
                        }
                        // is it multicall with attached FT?
                        else if (action.method_name === "ft_transfer_call") {
                            const ftTransferArgs = JSON.parse(Base64.decode(action.args));
                            const ftTransferMsg = JSON.parse(ftTransferArgs.msg);
                            if (ftTransferMsg.function_id && ftTransferMsg.function_id === "multicall") {
                                multicallArgs = JSON.parse(Base64.decode(ftTransferMsg.args));
                                return true;
                            }
                        }
                    });

                    if (multicallAction) {
                        proposalExistenceError.isBad = false;
                        argsFromProposalUpdate(multicallArgs.calls);
                    }
                }

                textInputComponent.forceUpdate();
            });
    };

    return (
        <Dialog
            className="modal-dialog"
            doneRename="Load"
            noSubmit={proposalURLIsInvalid || proposalDoesNotExist}
            onCancel={() => {}}
            onDone={() => window.LAYOUT.fromBase64(argsFromProposal)}
            title="Load from Proposal"
            {...{ onClose, open }}
        >
            <p>Enter proposal link from AstroDAO or base UI</p>

            <TextInput
                className="light-textfield"
                error={[proposalURLError, proposalExistenceError]}
                label="Proposal URL"
                update={onProposalURLUpdate}
                value={proposalURL}
                variant="filled"
            />

            <b className="warn">Your current multicall will be replaced!</b>
        </Dialog>
    );
};

export const ClearAllDialog = ({ onClose, open }) => (
    <Dialog
        className="modal-dialog"
        doneRename="Yes, clear all"
        onCancel={() => {}}
        onDone={() => LAYOUT.clear()}
        title="Clear All"
        {...{ onClose, open }}
    >
        <b className="warn">
            Are you sure you want to clear your multicall?
            <br />
            You cannot undo this action!
        </b>
    </Dialog>
);
