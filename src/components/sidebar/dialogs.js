import { TextField } from "@mui/material";
import { Base64 } from "js-base64";
import React, { useMemo, useReducer } from "react";
import { ArgsError, ArgsString } from "../../utils/args";
import { SputnikDAO } from "../../utils/contracts/sputnik-dao";
import { readFile, saveFile } from "../../utils/loader";
import { STORAGE } from "../../utils/persistent";
import Dialog from "../dialog/dialog";
import { TextInput } from "../editor/elements";

export const DAPP_LOGIN_METHODS = {
    dao: { actorKey: "dao", key: "daoDappLogin", title: "Login in dApp as DAO" },
    multicall: { actorKey: "multicall", key: "multicallDappLogin", title: "Login in dApp as Multicall" },
};

export const DappLoginDialog = ({ actorKey, onClose, open, title }) => {
    const dAppURL = useMemo(() => new ArgsString(""), []);
    const dAppURLError = useMemo(() => new ArgsError("Invalid URL", ({ value }) => new URL(value), true), []);

    const requestParams =
        `account_id=${STORAGE.addresses[actorKey]}` +
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
            <ul style={{ listStyleType: "auto" }}>
                <li>Go to the dApp website you want to use</li>
                <li>Log out your current wallet</li>
                <li>Copy the dApp URL</li>
                <li>Paste the URL in an input field below</li>
                <li>Click "Proceed" to continue</li>
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
    let fileName = "my-multicall";
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
                onChange={(e) => (fileName = e.target.value)}
            />
        </Dialog>
    );
};

export const LoadFromJsonDialog = ({ onClose, open }) => {
    let uploadedFile;
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
                onChange={(e) => (uploadedFile = e.target.files[0])}
            />

            <b className="warn">Your current multicall will be replaced!</b>
        </Dialog>
    );
};

export const LoadFromProposalDialog = ({ onClose, open }) => {
    const dialogComponent = React.createRef();

    const proposalURL = new ArgsString("");
    const proposalURLInvalid = new ArgsError(
        "Invalid URL",
        (urlInput) => !!SputnikDAO.getInfoFromProposalUrl(urlInput.value),
        true
    );

    const proposalNonExistent = new ArgsError(
        "The specified URL does not link to a proposal",
        (urlInput) => proposalNonExistent.isBad
    );

    let argsFromProposal;

    return (
        <Dialog
            className="modal-dialog"
            title="Load from Proposal"
            onCancel={() => {}}
            onDone={() => window.LAYOUT.fromBase64(argsFromProposal)}
            doneRename="Load"
            disable={() => proposalURLInvalid.isBad || proposalNonExistent.isBad}
            ref={dialogComponent}
            {...{ onClose, open }}
        >
            <TextInput
                label="Proposal URL"
                value={proposalURL}
                error={[proposalURLInvalid, proposalNonExistent]}
                update={(e, textInputComponent) => {
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
                                    argsFromProposal = multicallArgs.calls;
                                }
                            }
                            textInputComponent.forceUpdate();
                            dialogComponent.current.forceUpdate();
                        });
                    dialogComponent.current.forceUpdate();
                }}
                variant="filled"
                className="light-textfield"
            />

            <p>Enter proposal link from AstroDAO or base UI</p>
            <b className="warn">Your current multicall will be replaced!</b>
        </Dialog>
    );
};

export const ClearAllDialog = ({ onClose, open }) => {
    return (
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
};
