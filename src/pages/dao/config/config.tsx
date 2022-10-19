import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import clsx from "clsx";
import { HTMLProps, useState } from "react";

import { Multicall } from "../../../entities";
import { ArgsAccount, ArgsString } from "../../../shared/lib/args";
import { MulticallContract } from "../../../shared/lib/contracts/multicall";
import { SputnikDAOContract } from "../../../shared/lib/contracts/sputnik-dao";
import { toNEAR } from "../../../shared/lib/converter";
import { Button, TextInput, Tile } from "../../../shared/ui/components";

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
        multicall: MulticallContract;
    };

    daoContract: SputnikDAOContract;
}

const _DaoConfigTab = "DaoConfigTab";

const DaoConfigTabComponent = ({ className, contracts: { multicall }, daoContract }: DaoConfigTabComponentProps) => {
    const [editMode, setEditMode] = useState(false);
    const [addTokens, setAddTokens] = useState(multicall.tokensWhitelist);
    const [addToken, setAddToken] = useState(false);
    const [croncatManager, setCroncatManager] = useState("");
    const [editCroncat, setEditCroncat] = useState(false);

    return (
        <div className={clsx(_DaoConfigTab, className)}>
            <Tile
                className={`${_DaoConfigTab}-admins`}
                heading="Admins"
            >
                <ul className="list">
                    {multicall.admins.map((admin) => (
                        <li key={admin}>
                            <Link address={admin} />
                        </li>
                    ))}
                </ul>
            </Tile>

            {!editMode && (
                <Multicall.TokensWhitelist
                    className={`${_DaoConfigTab}-tokensWhitelist`}
                    daoContractAddress={daoContract.address}
                />
            )}

            {editMode && (
                <Tile
                    className={`${_DaoConfigTab}-tokensWhitelist`}
                    heading="Tokens whitelist"
                >
                    <IconButton
                        edge="start"
                        onClick={() => setAddToken(true)}
                    >
                        <AddOutlined />
                    </IconButton>

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
                            <TextInput
                                onBlur={(event) =>
                                    setAddTokens((previousState) => [...previousState, event.target.value])
                                }
                            />
                        ) : null}
                    </ul>
                </Tile>
            )}

            <Tile
                className={`${_DaoConfigTab}-jobsSettings`}
                heading="Jobs settings"
            >
                <h3>Croncat manager</h3>

                <IconButton
                    edge="start"
                    onClick={() => {
                        setEditMode(true);
                        setEditCroncat(true);
                    }}
                >
                    <EditOutlined />
                </IconButton>

                {editMode && editCroncat ? (
                    <TextInput
                        onBlur={(event) => {
                            setCroncatManager(event.target.value);
                            setEditCroncat(false);
                        }}
                        value={new ArgsString(multicall.croncatManager)}
                        fullWidth
                    />
                ) : (
                    <Link address={multicall.croncatManager} />
                )}

                <h3>Job bond</h3>

                <span>
                    {!editMode && (multicall.jobBond !== "" ? toNEAR(multicall.jobBond) : "...") + " Ⓝ"}

                    {editMode && (
                        <TextInput
                            InputProps={{ endAdornment: "Ⓝ" }}
                            type="number"
                            value={new ArgsString(multicall.jobBond !== "" ? toNEAR(multicall.jobBond) : "")}
                        />
                    )}
                </span>
            </Tile>

            <Tile
                className={`${_DaoConfigTab}-proposalForm`}
                heading={editMode ? "Changes proposal" : null}
            >
                {!editMode ? (
                    <Button
                        color="success"
                        label="Draft changes"
                        onClick={() => setEditMode(true)}
                    />
                ) : (
                    <>
                        <Button
                            color="error"
                            label="Cancel"
                            onClick={() => setEditMode(false)}
                        />

                        <Button
                            color="success"
                            label="Submit"
                            onClick={() => setEditMode(false)}
                        />
                    </>
                )}
            </Tile>
        </div>
    );
};

export const DaoConfigTab = {
    connect: (props: DaoConfigTabComponentProps) => ({
        content: <DaoConfigTabComponent {...props} />,
        name: "Config",
    }),
};
