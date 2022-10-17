import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton, TextField } from "@mui/material";
import clsx from "clsx";
import { HTMLProps, useState } from "react";

import { ArgsAccount } from "../../../shared/lib/args";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { toNEAR } from "../../../shared/lib/converter";
import { Tile } from "../../../shared/ui/components";

import "./config.scss";

const Link = ({
    address,
    deleteIcon = false,
    editIcon = false,
    onClick,
}: {
    address: string;
    deleteIcon?: boolean;
    editIcon?: boolean;
    onClick?: () => {};
}) => {
    const addr = new ArgsAccount(address);

    return (
        <span>
            <a
                href={addr.toUrl()}
                target="_blank"
                rel="noopener noreferrer"
            >
                {addr.value}
            </a>

            {deleteIcon ? <DeleteOutlined /> : editIcon ? <EditOutlined /> : null}
        </span>
    );
};

interface DaoConfigTabComponentProps extends HTMLProps<HTMLDivElement> {
    contracts: {
        multicall: Multicall;
    };
}

enum Mode {
    view = "VIEW",
    edit = "EDIT",
}

const _DaoConfigTab = "DaoConfigTab";

const DaoConfigTabComponent = ({ className, contracts: { multicall } }: DaoConfigTabComponentProps) => {
    const [editMode, setEditMode] = useState(false);
    const [addTokens, setAddTokens] = useState(multicall.tokensWhitelist);
    const [addToken, setAddToken] = useState(false);
    const [croncatManager, setCroncatManager] = useState("");
    const [editCroncat, setEditCroncat] = useState(false);
    const [addAdmins, setAddAdmins] = useState(multicall.admins);
    const [addAdmin, setAddAdmin] = useState(false);

    if (!editMode) {
        return (
            <>
                <div className={clsx(_DaoConfigTab, className)}>
                    <Tile className="AdminsList">
                        <h1 className="title">Admins</h1>

                        <ul className="list">
                            {multicall.admins.map((admin) => (
                                <li key={admin}>
                                    <Link address={admin} />
                                </li>
                            ))}
                        </ul>
                    </Tile>

                    <Tile className="TokenWhitelist">
                        <h1 className="title">Whitelisted Tokens</h1>

                        <ul className="list">
                            {multicall.tokensWhitelist.map((token) => (
                                <li key={token}>
                                    <Link address={token} />
                                </li>
                            ))}
                        </ul>
                    </Tile>

                    <Tile className="JobBond">
                        <h1 className="JobBond-title title">
                            Job Bond
                            <span>{`${multicall.jobBond !== "" ? toNEAR(multicall.jobBond) : "..."} Ⓝ`}</span>
                        </h1>
                    </Tile>

                    <Tile className="CroncatManager">
                        <h1 className="CroncatMng-title title">Croncat Manager</h1>
                        <ul className="list">
                            <li>
                                <Link address={multicall.croncatManager} />
                            </li>
                        </ul>
                    </Tile>
                </div>

                <button
                    style={{ alignSelf: "start", borderRadius: "5px" }}
                    onClick={() => setEditMode(true)}
                >
                    Edit
                </button>
            </>
        );
    } else {
        return (
            <>
                <div className={clsx(_DaoConfigTab, className)}>
                    <Tile className="AdminsList">
                        <IconButton
                            edge="start"
                            onClick={() => setAddAdmin(true)}
                        >
                            <AddOutlined />
                        </IconButton>

                        <h1 className="title">Admins</h1>

                        <ul className="list">
                            {addAdmins.map((admin) => (
                                <li key={admin}>
                                    <Link
                                        address={admin}
                                        deleteIcon
                                    />
                                </li>
                            ))}

                            {addAdmin ? (
                                <TextField onBlur={(e) => setAddAdmins((arr) => [...arr, e.target.value])} />
                            ) : null}
                        </ul>
                    </Tile>

                    <Tile className="TokenWhitelist">
                        <IconButton
                            edge="start"
                            onClick={() => setAddToken(true)}
                        >
                            <AddOutlined />
                        </IconButton>

                        <h1 className="title">Whitelisted Tokens</h1>

                        <ul className="list">
                            {addTokens.map((token) => (
                                <li key={token}>
                                    <Link
                                        address={token}
                                        deleteIcon
                                    />
                                </li>
                            ))}

                            {addToken ? (
                                <TextField onBlur={(e) => setAddTokens((arr) => [...arr, e.target.value])} />
                            ) : null}
                        </ul>
                    </Tile>

                    <Tile className="JobBond">
                        <h1 className="JobBond-title title">
                            Job Bond
                            <span>
                                <TextField
                                    variant="filled"
                                    defaultValue={multicall.jobBond !== "" ? toNEAR(multicall.jobBond) : "..."}
                                />
                                {`Ⓝ`}
                            </span>
                        </h1>
                    </Tile>

                    <Tile className="CroncatManager">
                        <IconButton
                            edge="start"
                            onClick={() => setEditCroncat(true)}
                        >
                            <EditOutlined />
                        </IconButton>

                        <h1 className="CroncatMng-title title">Croncat Manager</h1>

                        <ul className="list">
                            <li>
                                {editCroncat ? (
                                    <TextField
                                        onBlur={(e) => {
                                            setCroncatManager(e.target.value);
                                            setEditCroncat(false);
                                        }}
                                        defaultValue={multicall.croncatManager}
                                        size="small"
                                    />
                                ) : (
                                    <Link address={multicall.croncatManager} />
                                )}
                            </li>
                        </ul>
                    </Tile>

                    <button
                        style={{ alignSelf: "start", borderRadius: "5px" }}
                        onClick={() => setEditMode(false)}
                    >
                        Confirm
                    </button>
                </div>
            </>
        );
    }
};

export const DaoConfigTab = {
    connect: (props: DaoConfigTabComponentProps) => ({
        content: <DaoConfigTabComponent {...props} />,
        title: "Config",
    }),
};
