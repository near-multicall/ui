import { InfoOutlined } from "@mui/icons-material";
import { TextField } from "@mui/material";
import { Base64 } from "js-base64";
import React, { useEffect, useMemo, useReducer, useState } from "react";

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

    const URLInvalid = ArgsError.useInstance("Invalid URL", Validation.isUrl, true);

    const [requestURL, requestURLUpdate] = useReducer((currentValue, value) => {
        if (URLInvalid.$detected) {
            return currentValue;
        } else {
            const url = new URL(value);
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
            noSubmit={URLInvalid.$detected}
            onSubmit={() => window.open(requestURL, "_blank")}
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
                error={URLInvalid.instance}
                label="dApp URL"
                update={({ target }) => requestURLUpdate(target.value)}
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
            onSubmit={() => saveFile(`${fileName}.json`, [JSON.stringify(LAYOUT.toBase64(), null, 2)])}
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

export const LoadFromJsonDialog = ({ open, ...props }) => {
    const [uploadedFile, uploadedFileUpdate] = useState(null);

    const onClose = () => {
        props.onClose();
        uploadedFileUpdate(null);
    };

    return (
        <Dialog
            className="modal-dialog"
            doneRename="Load"
            noSubmit={uploadedFile === null}
            onSubmit={() => readFile(uploadedFile, (json) => LAYOUT.fromBase64(json))}
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

    const URLInvalid = ArgsError.useInstance("Invalid URL", Validation.isUrl),
        proposalURLInvalid = ArgsError.useInstance("URL does not link to proposal", SputnikDAO.isProposalURLValid),
        proposalNonCompatible = ArgsError.useInstance("Proposal is not compatible with multicall");

    const onProposalURLUpdate = (_event, textInputComponent) => {
        if (!(URLInvalid.$detected || proposalURLInvalid.$detected)) {
            const { dao: daoAddress, proposalId } = SputnikDAO.getInfoFromProposalUrl(proposalURL.value);

            /*
              ! SputnikDAO instance must be created using init() to make sure DAO exists
              ! on that address. We use constructor here because of previous logic checks.
            */
            const dao = new SputnikDAO(daoAddress);

            dao.getProposal(proposalId)
                .catch(proposalURLInvalid.detected)
                .then((proposal) => {
                    if (Boolean(proposal)) {
                        const multicallAction = proposal.kind?.FunctionCall?.actions.find((action) => {
                            switch (action.method_name) {
                                // Is it regular multicall?
                                case "multicall": {
                                    argsFromProposalUpdate(JSON.parse(Base64.decode(action.args)).calls);
                                    return true;
                                }
                                // Is it multicall with attached FT?
                                case "ft_transfer_call": {
                                    const ftTransferArgs = JSON.parse(Base64.decode(action.args)),
                                        ftTransferMsg = JSON.parse(ftTransferArgs.msg);

                                    if (ftTransferMsg.function_id && ftTransferMsg.function_id === "multicall") {
                                        argsFromProposalUpdate(JSON.parse(Base64.decode(ftTransferMsg.args)).calls);
                                        return true;
                                    }
                                }
                            }
                        });

                        console.log(multicallAction);

                        proposalNonCompatible.detected(!Boolean(multicallAction));
                        textInputComponent.forceUpdate();
                    }
                });
        }
    };

    return (
        <Dialog
            className="modal-dialog"
            doneRename="Load"
            onSubmit={() => window.LAYOUT.fromBase64(argsFromProposal)}
            noSubmit={URLInvalid.$detected || proposalURLInvalid.$detected || proposalNonCompatible.$detected}
            title="Load from Proposal"
            {...{ onClose, open }}
        >
            <p>Enter proposal link from AstroDAO or base UI</p>

            <TextInput
                className="light-textfield"
                error={[URLInvalid.instance, proposalURLInvalid.instance, proposalNonCompatible.instance]}
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
        onSubmit={() => LAYOUT.clear()}
        title="Clear All"
        {...{ onClose, open }}
    >
        <b className="warn">
            Are you sure you want to clear your multicall layout?
            <br />
            You cannot undo this action!
        </b>
    </Dialog>
);
