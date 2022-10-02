import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { InputAdornment } from "@mui/material";
import Icon from "@mui/material/Icon";
import TextField from "@mui/material/TextField";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import { Component } from "react";
import { Link } from "react-router-dom";

import { ArgsAccount, ArgsBig, ArgsError, ArgsString } from "../../utils/args";
import { Multicall } from "../../utils/contracts/multicall";
import { errorMsg } from "../../utils/errors";
import { STORAGE } from "../../utils/persistent";
import { convert, toGas, toNEAR, toYocto } from "../../utils/converter";
import { signAndSendTxs, view } from "../../utils/wallet";
import { useWalletSelector } from "../../contexts/walletSelectorContext";
import { TextInput, TextInputWithUnits } from "../editor/elements";
import "./export.scss";

export class Export extends Component {
    static contextType = useWalletSelector();

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
        // Keep max gas below 270 Tgas, leaves a max of 30 Tgas for DAO operations if users vote with 300 Tgas.
        // Keep max gas below 270 Tgas for jobs (croncat compatibility). See: https://github.com/CronCats/contracts/blob/cafd3caafb91b45abb6e811ce0fa2819980d6f96/manager/src/tasks.rs#L84
        gas: new ArgsBig("267.5", toGas("1"), toGas("270"), "Tgas"),
        depo: new ArgsBig(toNEAR("1"), "1", null, "NEAR"),
        desc: new ArgsString(""),
    };

    ft = {
        amount: new ArgsBig("1", "1", null, "yocto"),
        token: new ArgsAccount(window.nearConfig.WNEAR_ADDRESS),
    };

    updateFTDebounced = debounce(() => this.updateFT(), 500);

    constructor(props) {
        super(props);

        this.state = {
            attachNEAR: false,
            attachFT: false,
            showArgs: false,
            useJobs: false,
        };

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
        const { showArgs: oldValue } = this.state;
        this.setState({ showArgs: !oldValue });
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

    renderProposeButton(multicallArgs) {
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
            const { attachNEAR, attachFT, useJobs } = this.state;
            const { gas, depo, desc } = this.total;
            const { token, amount } = this.ft;
            const errors = this.errors;
            // check if "propose" button is disabled
            const isProposeDisabled =
                errors.dao.isBad ||
                errors.multicall.isBad ||
                errors.depo.isBad ||
                errors.desc.isBad ||
                errors.hasErrors.isBad ||
                (attachFT &&
                    (errors.amount.isBad ||
                        errors.token.isBad ||
                        errors.noToken.isBad ||
                        errors.notWhitelisted.isBad)) ||
                walletError;

            return (
                <button
                    className="propose button"
                    disabled={isProposeDisabled}
                    onClick={async () => {
                        const { currentDAO: dao } = WALLET_COMPONENT.state;
                        // case 1: immediate execution => basic multicall
                        if (!useJobs) {
                            // multicall with attached FT
                            if (attachFT) {
                                const tx = await dao.proposeMulticallFT(
                                    desc.value,
                                    multicallArgs,
                                    convert(gas.value, gas.unit),
                                    token.value,
                                    convert(amount.value, amount.unit, amount.decimals)
                                );
                                signAndSendTxs([tx]);
                            }
                            // multicall with attached NEAR
                            else {
                                const tx = await dao.proposeMulticall(
                                    desc.value,
                                    multicallArgs,
                                    // if attach NEAR disabled, ignore depo amount and attach 1 yocto.
                                    attachNEAR ? convert(depo.value, depo.unit) : "1",
                                    convert(gas.value, gas.unit)
                                );
                                signAndSendTxs([tx]);
                            }
                        }
                        // case2: scheduled execution => use jobs
                        else {
                            const multicallAddress = STORAGE.addresses.multicall;
                            const temporary = new Multicall(multicallAddress);
                            // multicall with attached FT
                            if (attachFT) {
                                console.log("multicall job with attached FT");
                            }
                            //    WALLET_COMPONENT.state.currentDAO.proposeMulticallFT(
                            //        desc.value,
                            //        multicallArgs,
                            //        convert(gas.value, gas.unit),
                            //        token.value,
                            //        convert(amount.value, amount.unit, amount.decimals)
                            //    );
                            // multicall with attached NEAR
                            else {
                                console.log("multicall job with attached NEAR");
                                const [jobCount, multicall] = await Promise.all([
                                    temporary.getJobCount(),
                                    Multicall.init(STORAGE.addresses.multicall),
                                ]);
                                const [addJobTx, proposeJobTx] = await Promise.all([
                                    multicall.addJob([], new Date(), toGas("100"), toYocto("1")),
                                    dao.proposeJobActivation("test job activation", jobCount, toYocto("1")),
                                ]);
                                signAndSendTxs([addJobTx, proposeJobTx]);
                            }
                            //    WALLET_COMPONENT.state.currentDAO.proposeMulticall(
                            //        desc.value,
                            //        multicallArgs,
                            //        // if attach NEAR disabled, ignore depo amount and attach 1 yocto.
                            //        attachNEAR ? convert(depo.value, depo.unit) : "1",
                            //        convert(gas.value, gas.unit)
                            //    );
                        }
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
        const { attachNEAR, attachFT, showArgs } = this.state;
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

        // Multicall args used in making the proposal
        let multicallArgs = {};
        // Multicall args in text form to display for copy/pasting args
        let multicallArgsText = "";
        // Return error message if a card has JSON errors. Faulty JSON breaks toBase64.
        const hasJsonErrors =
            errors.hasErrors.isBad && allErrors.some((err) => err.message === errorMsg.ERR_INVALID_ARGS);
        if (hasJsonErrors) {
            multicallArgsText = "Please fix invalid JSON errors";
        } else {
            // toBase64 might throw on failure
            try {
                multicallArgs = { calls: LAYOUT.toBase64() };
                multicallArgsText = !attachFT
                    ? JSON.stringify(multicallArgs)
                    : JSON.stringify({
                          receiver_id: STORAGE.addresses.multicall,
                          amount: convert(amount.value, amount.unit, amount.decimals),
                          msg: JSON.stringify({
                              function_id: "multicall",
                              args: Base64.encode(JSON.stringify(multicallArgs).toString()),
                          }).toString(),
                      });
            } catch (e) {
                multicallArgsText = "ERROR: something went wrong during JSON creation";
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
                            className={attachNEAR ? "selected" : ""}
                            onClick={() => {
                                this.setState({
                                    attachNEAR: !attachNEAR,
                                    attachFT: false,
                                });
                            }}
                        >
                            NEAR
                        </button>
                        <p>or</p>
                        <button
                            className={attachFT ? "selected" : ""}
                            onClick={() => {
                                this.setState({
                                    attachNEAR: false,
                                    attachFT: !attachFT,
                                });
                            }}
                        >
                            fungible token
                        </button>
                    </div>
                    {attachNEAR ? (
                        <TextInputWithUnits
                            label="Total attached deposit"
                            value={depo}
                            error={errors.depo}
                            options={["NEAR", "yocto"]}
                            update={this.update}
                        />
                    ) : null}
                    {attachFT ? (
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
                    <FormControl>
                        <FormLabel id="demo-radio-buttons-group-label">Execution:</FormLabel>
                        <RadioGroup
                            aria-labelledby="demo-radio-buttons-group-label"
                            defaultValue="immediate"
                            name="radio-buttons-group"
                            onChange={(event, value) => {
                                if (value === "immediate") this.setState({ useJobs: false });
                                else if (value === "scheduled") this.setState({ useJobs: true });
                            }}
                        >
                            <FormControlLabel
                                value="immediate"
                                control={<Radio />}
                                label="Immediate"
                            />
                            <FormControlLabel
                                value="scheduled"
                                control={<Radio />}
                                label="Scheduled"
                            />
                        </RadioGroup>
                    </FormControl>
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
                            collapsed={showArgs ? "no" : "yes"}
                        >
                            expand_more
                        </Icon>
                        <h3 onClick={() => this.toggleShowArgs()}>Multicall args</h3>
                        {showArgs ? (
                            <Icon
                                className="icon copy"
                                onClick={(e) => {
                                    navigator.clipboard.writeText(multicallArgsText);
                                    this.updateCopyIcon(e);
                                }}
                            >
                                content_copy
                            </Icon>
                        ) : (
                            <></>
                        )}
                    </div>
                    {showArgs ? (
                        <div className="value">
                            <pre className="code">{multicallArgsText}</pre>
                        </div>
                    ) : (
                        <></>
                    )}
                </div>
                <div className="spacer"></div>
                {this.renderProposeButton(multicallArgs)}
            </div>
        );
    }
}
