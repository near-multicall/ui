import { TextField } from "@mui/material";
import { Base64 } from "js-base64";
import { useMemo, useState } from "react";

import { ArgsError, ArgsString } from "../../shared/lib/args";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";
import { readFile, saveFile } from "../../shared/lib/loader";
import { Validation } from "../../shared/lib/validation";
import { Dialog, TextInput } from "../../shared/ui/components";

export const SaveAsJsonDialog = ({ onClose, open }) => {
    const [fileName, fileNameUpdate] = useState("my-multicall");

    return (
        <Dialog
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
        proposalURLInvalid = ArgsError.useInstance("URL doesn't link to proposal", SputnikDAO.isProposalURLValid),
        proposalNonCompatible = ArgsError.useInstance("Proposal is incompatible with multicall or doesn't exist");

    const onProposalURLUpdate = (_event, textInputComponent) => {
        if (!(URLInvalid.instance.isBad || proposalURLInvalid.instance.isBad)) {
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

                        proposalNonCompatible.detected(!Boolean(multicallAction));
                        textInputComponent.forceUpdate();
                    }
                });
        }
    };

    return (
        <Dialog
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
