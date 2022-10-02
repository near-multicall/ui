import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { InputAdornment } from "@mui/material";
import Icon from "@mui/material/Icon";
import TextField from "@mui/material/TextField";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import React, { Component } from "react";
import { Link } from "react-router-dom";

import { ArgsAccount, ArgsBig, ArgsError, ArgsString } from "../../shared/lib/args";
import { errorMsg } from "../../shared/lib/errors";
import { STORAGE } from "../../shared/lib/persistent";
import { convert, toGas, toNEAR } from "../../shared/lib/converter";
import { view } from "../../shared/lib/wallet";
import { Wallet } from "../../entities";
import { TextInput, TextInputWithUnits } from "../editor/elements";
import "./export.scss";

export class Export extends Component {
    static contextType = Wallet.useSelector();

    errors = {
        user: new ArgsError(errorMsg.ERR_INVALID_ADDR, (value) => ArgsAccount.isValid(value), true),
        dao: new ArgsError("Invalid address", (value) => ArgsAccount.isValid(value), true),
        multicall: new ArgsError("Invalid address", (value) => ArgsAccount.isValid(value), true),
        gas: new ArgsError(errorMsg.ERR_INVALID_GAS_AMOUNT, (value) => ArgsBig.isValid(value) && value.value !== ""),
        depo: new ArgsError(errorMsg.ERR_INVALID_DEPO_AMOUNT, (value) => ArgsBig.isValid(value) && value.value !== ""),
        amount: new ArgsError("Invalid amount", (value) => ArgsBig.isValid(value) && value.value !== ""),
        token: new ArgsError("Invalid address", (value) => ArgsAccount.isValid(value)),
        desc: new ArgsError("Invalid proposal description", (value) => value.value !== "", true),
        noToken: new ArgsError("Address does not belong to token contract", (value) => this.errors.noToken),
        notWhitelisted: new ArgsError(
            "Token not whitelisted on multicall instance",
            (value) => this.errors.notWhitelisted
        ),
        hasErrors: new ArgsError("Please fix all errors", (value) => this.errors.hasErrors),
    };

    total = {
        gas: new ArgsBig("267.5", toGas("1"), toGas("270"), "Tgas"),
        depo: new ArgsBig(toNEAR("1"), "1", null, "NEAR"),
        desc: new ArgsString(""),
    };

    ft = {
        amount: new ArgsBig("1", "1", null, "yocto"),
        token: new ArgsAccount(window.nearConfig.WNEAR_ADDRESS),
    };

    attachNEAR = false;
    attachFT = false;
    showArgs = false;

    updateFTDebounced = debounce(() => this.updateFT(), 500);

    constructor(props) {
        super(props);

        this.update = this.update.bind(this);

        document.addEventListener("onaddressesupdated", (e) => this.onAddressesUpdated(e));
    }

    componentDidMount() {
        window.EXPORT = this;
    }

    onAddressesUpdated() {
        this.updateFT();
    }

    updateCopyIcon(e) {
        if (e.target.innerHTML === "done") return;

        const oldIcon = e.target.innerHTML;
        e.target.innerHTML = "done";

        setTimeout(() => {
            e.target.innerHTML = oldIcon;
        }, 1000);
    }

    toggleShowArgs() {
        this.showArgs = !this.showArgs;
        this.forceUpdate();
    }

    update() {
        // Hack to bind function to this
        this.forceUpdate();
    }

    updateFT() {
        const { token, amount } = this.ft;

        this.errors.noToken.isBad = false;
        this.errors.notWhitelisted.isBad = false;

        if (this.errors.token.isBad) return;

        Promise.all([
            view(token.value, "ft_metadata", {}).catch((e) => {
                if (e.type === "AccountDoesNotExist" || e.toString().includes("MethodNotFound"))
                    this.errors.noToken.isBad = true;
            }),
            view(STORAGE.addresses.multicall, "get_tokens", {}).catch((e) => {
                // console.error("failed fetching token whitelist", e);
            }),
        ]).then(([metadata, whitelist]) => {
            if (metadata) {
                amount.unit = metadata.symbol;
                amount.decimals = metadata.decimals;
            }
            // check if token is whitelisted on multicall
            if (whitelist) {
                this.errors.notWhitelisted.isBad = !this.errors.noToken.isBad && !whitelist.includes(token.value);
            }

            this.update();
        });
    }

    renderProposeButton() {
        const { selector: walletSelector } = this.context;
        const walletError = window?.WALLET_COMPONENT?.errors
            ? Object.entries(WALLET_COMPONENT.errors).filter(([k, v]) => v.isBad)[0]?.[1].message
            : null;

        // if user not logged in, button will do login.
        if (!walletSelector.isSignedIn()) {
            return (
                <button
                    className="login button"
                    onClick={() => WALLET_COMPONENT.signIn()}
                >
                    Connect to Wallet
                </button>
            );
        }
        // if specified DAO not have a multicall instance, button will re-direct to DAO page so they can get an instance.
        else if (walletError === errorMsg.ERR_DAO_HAS_NO_MTCL) {
            return (
                <button
                    className="propose button"
                    disabled
                >
                    {walletError}. <Link to="/dao">Get one now!</Link>
                </button>
            );
        }
        // normal propose multicall to DAO functionality
        else {
            const { gas, depo, desc } = this.total;
            const errors = this.errors;
            // check if "propose" button is disabled
            const isProposeDisabled =
                errors.dao.isBad ||
                errors.multicall.isBad ||
                errors.depo.isBad ||
                errors.desc.isBad ||
                errors.hasErrors.isBad ||
                (this.attachFT &&
                    (errors.amount.isBad ||
                        errors.token.isBad ||
                        errors.noToken.isBad ||
                        errors.notWhitelisted.isBad)) ||
                walletError;

            return (
                <button
                    className="propose button"
                    disabled={isProposeDisabled}
                    onClick={() => {
                        // multicall with attached FT
                        if (this.attachFT)
                            WALLET_COMPONENT.proposeFT(
                                desc.value,
                                convert(gas.value, gas.unit),
                                token.value,
                                convert(amount.value, amount.unit, amount.decimals)
                            );
                        // multicall with attached NEAR
                        else if (this.attachNEAR)
                            WALLET_COMPONENT.propose(
                                desc.value,
                                convert(depo.value, depo.unit),
                                convert(gas.value, gas.unit)
                            );
                        // attach NEAR disabled, ignore depo amount and attach 1 yocto.
                        else WALLET_COMPONENT.propose(desc.value, "1", convert(gas.value, gas.unit));
                    }}
                >
                    {`Propose on ${STORAGE.addresses.dao}`}
                    {walletError ? <p>{walletError}</p> : <></>}
                </button>
            );
        }
    }

    render() {
        const LAYOUT = this.props.layout; // ususally global parameter

        const { gas, depo, desc } = this.total;
        const { amount, token } = this.ft;

        const allErrors = LAYOUT.toErrors();
        const errors = this.errors;

        errors.hasErrors.isBad = allErrors.length > 0;

        // update internal state of address errors
        Object.entries(STORAGE.addresses).forEach(([k, v]) => {
            const account = new ArgsAccount(v);
            errors[k].validOrNull(account);
        });

        // Multicall args to display for copy/paste
        let multicallArgs = "";
        if (this.showArgs) {
            // Return error message if a card has JSON errors. Faulty JSON breaks toBase64.
            const hasJsonErrors =
                errors.hasErrors.isBad && allErrors.some((err) => err.message === errorMsg.ERR_INVALID_ARGS);
            if (hasJsonErrors) {
                multicallArgs = "Please fix invalid JSON errors";
            } else {
                // toBase64 might throw on failure
                try {
                    multicallArgs = !this.attachFT
                        ? JSON.stringify({ calls: LAYOUT.toBase64() })
                        : JSON.stringify({
                              receiver_id: STORAGE.addresses.multicall,
                              amount: convert(amount.value, amount.unit, amount.decimals),
                              msg: JSON.stringify({
                                  function_id: "multicall",
                                  args: Base64.encode(JSON.stringify({ calls: LAYOUT.toBase64() }).toString()),
                              }).toString(),
                          });
                } catch (e) {
                    multicallArgs = "ERROR: something went wrong during JSON creation";
                }
            }
        }

        return (
            <div className="export-container">
                <div className="input-container">
                    <TextInput
                        label="Proposal description"
                        value={desc}
                        error={errors.desc}
                        multiline
                        update={this.update}
                    />
                    <TextInputWithUnits
                        label="Total allocated gas"
                        value={gas}
                        error={errors.gas}
                        options={["Tgas", "gas"]}
                        update={this.update}
                    />
                    <div className="attachment">
                        <p>Attach</p>
                        <button
                            className={this.attachNEAR ? "selected" : ""}
                            onClick={() => {
                                this.attachNEAR = !this.attachNEAR;
                                this.attachFT = false;
                                this.update();
                            }}
                        >
                            NEAR
                        </button>
                        <p>or</p>
                        <button
                            className={this.attachFT ? "selected" : ""}
                            onClick={() => {
                                this.attachNEAR = false;
                                this.attachFT = !this.attachFT;
                                this.update();
                            }}
                        >
                            fungible token
                        </button>
                    </div>
                    {this.attachNEAR ? (
                        <TextInputWithUnits
                            label="Total attached deposit"
                            value={depo}
                            error={errors.depo}
                            options={["NEAR", "yocto"]}
                            update={this.update}
                        />
                    ) : null}
                    {this.attachFT ? (
                        <>
                            <TextInput
                                label="Token address"
                                value={token}
                                error={[errors.token, errors.noToken, errors.notWhitelisted]}
                                update={() => {
                                    this.update();
                                    this.updateFTDebounced();
                                }}
                            />
                            <TextField
                                label="Amount"
                                value={errors.amount.validOrNull(amount) || errors.amount.intermediate}
                                margin="dense"
                                size="small"
                                onChange={(e) => {
                                    amount.value = e.target.value;
                                    errors.amount.validOrNull(amount);
                                    this.update();
                                }}
                                error={errors.amount.isBad}
                                helperText={errors.amount.isBad && errors.amount.message}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">{amount.unit}</InputAdornment>,
                                }}
                            />
                        </>
                    ) : null}
                </div>
                {/* Display cards' errors */}
                {allErrors.length > 0 && (
                    <div className="error-container">
                        <div className="header">
                            <h3>{`Card errors (${allErrors.length})`}</h3>
                        </div>
                        <div className="error-list">
                            {allErrors.map((e, i) => (
                                <div
                                    className="error"
                                    key={`error-${i}`}
                                >
                                    <p className="msg">{`[${e.task.call.name}] Error: ${e.message}`}</p>
                                    <EditOutlinedIcon
                                        className="icon"
                                        onClick={() => {
                                            EDITOR.edit(e.task.props.id);
                                            MENU.activeTabSwitch(1);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="section">
                    <div className="sidebar">
                        <Icon
                            className="icon collapse"
                            onClick={() => this.toggleShowArgs()}
                            collapsed={this.showArgs ? "no" : "yes"}
                        >
                            expand_more
                        </Icon>
                        <h3 onClick={() => this.toggleShowArgs()}>Multicall args</h3>
                        {this.showArgs ? (
                            <Icon
                                className="icon copy"
                                onClick={(e) => {
                                    navigator.clipboard.writeText(multicallArgs);
                                    this.updateCopyIcon(e);
                                }}
                            >
                                content_copy
                            </Icon>
                        ) : (
                            <></>
                        )}
                    </div>
                    {this.showArgs ? (
                        <div className="value">
                            <pre className="code">{multicallArgs}</pre>
                        </div>
                    ) : (
                        <></>
                    )}
                </div>
                <div className="spacer"></div>
                {this.renderProposeButton()}
            </div>
        );
    }
}
