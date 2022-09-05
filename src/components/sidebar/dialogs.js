import { InfoOutlined } from "@mui/icons-material";
import { TextField } from "@mui/material";
import { Base64 } from "js-base64";
import React, { useMemo, useReducer, useState } from "react";

import { ArgsError, ArgsString } from "../../utils/args";
import { SputnikDAO } from "../../utils/contracts/sputnik-dao";
import { readFile, saveFile } from "../../utils/loader";
import { STORAGE } from "../../utils/persistent";
import Dialog from "../dialog/dialog";
import { TextInput } from "../editor/elements";
import { Tooltip } from "../tooltip/index.js";
import "./dialogs.scss";

const DAPP_LOGIN_INSTRUCTIONS = [
    {
        text: "Go to the dApp website you want to use",
        hint: "In all your travels, have you ever seen a star go supernova? Well, I have. I saw a star explode and send out the building blocks of the Universe. Other stars, other planets and eventually other life. A supernova! Creation itself! I was there. I wanted to see it and be part of the moment. And you know how I perceived one of the most glorious events in the universe? With these ridiculous gelatinous orbs in my skull! With eyes designed to perceive only a tiny fraction of the EM spectrum. With ears designed only to hear vibrations in the air.",
    },
    {
        text: "Log out your current wallet",
        hint: "We can't define consciousness because consciousness does not exist. Humans fancy that there's something special about the way we perceive the world, and yet we live in loops as tight and as closed as the hosts do, seldom questioning our choices, content, for the most part, to be told what to do next.",
    },
    {
        text: "Copy the dApp URL",
        hint: "A long time ago, the Ancients made a discovery. They found evidence of a structure buried deep within the background radiation. They believed that, at one time, this structure had genuine complexity, coherence, therefore could not have occurred naturally.",
    },
    {
        text: "Paste the URL in an input field below",
        hint: "Humanity has spread to the stars. We set out like ancient seafarers to explore the limitless ocean of space. But no matter how far we venture into the unknown, the worst monsters are those we bring with us.",
    },
    { text: 'Click "Proceed" to continue' },
];

export const DappLoginDialog = ({ actorType, onClose, open, title }) => {
    const dAppURL = useMemo(() => new ArgsString(""), []);
    const dAppURLError = useMemo(() => new ArgsError("Invalid URL", ({ value }) => new URL(value), true), []);

    const requestParams =
        `account_id=${STORAGE.addresses[actorType]}` +
        `&public_key=ed25519%3ADEaoD65LomNHAMzhNZva15LC85ntwBHdcTbCnZRXciZH` +
        `&all_keys=ed25519%3A9jeqkc8ybv7aYSA7uLNFUEn8cgKo759yue4771bBWsSr`;

    const [requestURL, requestURLUpdate] = useReducer((currentValue, event) =>
        dAppURLError.isBad ? currentValue : new URL(event.target.value).origin + "/?" + requestParams
    );

    return (
        <Dialog
            className="modal-dialog"
            onCancel={() => {}}
            onDone={() => window.open(requestURL, "_blank")}
            doneRename="Proceed"
            disable={() => dAppURLError.isBad}
            {...{ onClose, open, title }}
        >
            <ul style={{ listStyleType: "decimal", padding: "0 20px" }}>
                {DAPP_LOGIN_INSTRUCTIONS.map(({ text, hint }) => (
                    <li key={text}>
                        {text}

                        {hint && (
                            <Tooltip
                                placement="right"
                                title={hint}
                            >
                                <InfoOutlined sx={{ pl: 1 }} />
                            </Tooltip>
                        )}
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
            title="Save As JSON"
            onCancel={() => {}}
            onDone={() => saveFile(`${fileName}.json`, [JSON.stringify(LAYOUT.toBase64(), null, 2)])}
            doneRename="Download"
            {...{ onClose, open }}
        >
            <TextField
                label="Multicall title"
                defaultValue="my-multicall"
                variant="filled"
                className="light-textfield"
                helperText="Please give a name to your multicall"
                onChange={(event) => fileNameUpdate(event.target.value)}
            />
        </Dialog>
    );
};

export const LoadFromJsonDialog = ({ onClose, open }) => {
    const [uploadedFile, uploadedFileUpdate] = useState(null);

    return (
        <Dialog
            className="modal-dialog"
            title="Load From JSON"
            onCancel={() => {}}
            onDone={() => readFile(uploadedFile, (json) => LAYOUT.fromBase64(json))}
            doneRename="Load"
            {...{ onClose, open }}
        >
            <input
                accept=".json,application/JSON"
                type="file"
                onChange={(event) => uploadedFileUpdate(event.target.files[0])}
            />

            <b className="warn">Your current multicall will be replaced!</b>
        </Dialog>
    );
};

export const LoadFromProposalDialog = ({ onClose, open }) => {
    const [argsFromProposal, argsFromProposalUpdate] = useState(null);
    const proposalURL = useMemo(() => new ArgsString(""), []);

    const proposalURLInvalid = useMemo(
        () => new ArgsError("Invalid URL", (urlInput) => !!SputnikDAO.getInfoFromProposalUrl(urlInput.value), true),
        []
    );

    const proposalNonExistent = new ArgsError(
        "The specified URL does not link to a proposal",
        (urlInput) => proposalNonExistent.isBad
    );

    const onProposalURLUpdate = (_event, textInputComponent) => {
        // don't fetch proposal info from bad URL.
        if (proposalURLInvalid.isBad) {
            proposalNonExistent.isBad = false;
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
                proposalNonExistent.isBad = true;
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
                        proposalNonExistent.isBad = false;
                        argsFromProposalUpdate(multicallArgs.calls);
                    }
                }

                textInputComponent.forceUpdate();
            });
    };

    return (
        <Dialog
            className="modal-dialog"
            title="Load from Proposal"
            onCancel={() => {}}
            onDone={() => window.LAYOUT.fromBase64(argsFromProposal)}
            doneRename="Load"
            disable={() => proposalURLInvalid.isBad || proposalNonExistent.isBad}
            {...{ onClose, open }}
        >
            <p>Enter proposal link from AstroDAO or base UI</p>

            <TextInput
                label="Proposal URL"
                value={proposalURL}
                error={[proposalURLInvalid, proposalNonExistent]}
                update={onProposalURLUpdate}
                variant="filled"
                className="light-textfield"
            />

            <b className="warn">Your current multicall will be replaced!</b>
        </Dialog>
    );
};

export const ClearAllDialog = ({ onClose, open }) => (
    <Dialog
        className="modal-dialog"
        title="Clear All"
        onCancel={() => {}}
        onDone={() => LAYOUT.clear()}
        doneRename="Yes, clear all"
        {...{ onClose, open }}
    >
        <b className="warn">
            Are you sure you want to clear your multicall?
            <br />
            You cannot undo this action!
        </b>
    </Dialog>
);
