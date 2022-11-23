import { EditOutlined as EditOutlinedIcon } from "@mui/icons-material";
import { Icon, InputAdornment } from "@mui/material";
import clsx from "clsx";
import { Form, Formik } from "formik";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import React, { Component, ContextType } from "react";
import { Link } from "react-router-dom";

import { Wallet } from "../../entities";
import { args } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { CallError } from "../../shared/lib/call";
import { Multicall, MulticallArgs } from "../../shared/lib/contracts/multicall";
import { toNEAR, unit } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { FungibleToken } from "../../shared/lib/standards/fungibleToken";
import { signAndSendTxs } from "../../shared/lib/wallet";
import { DateTimePicker } from "../../shared/ui/design";
import { ChoiceField, TextField, UnitField } from "../../shared/ui/form";
import "./export.scss";

const Ctx = Wallet.trySelectorContext();

type FormData = {
    description: string;
    gas: string;
    gasUnit: unit | number;
    depo: string;
    depoUnit: unit | number;
    attachment: ("ft" | "near")[];
    tokenAddress: string;
    tokenAmount: string;
    execution: ("immediate" | "scheduled")[];
    dateTime: Date;
};

interface Props {
    layout: any;
}

interface State {
    formData: FormData;
    showArgs: boolean;
    token: FungibleToken;
}

const _Export = "Export";

export class Export extends Component<Props, State> {
    static contextType = Ctx;
    declare context: ContextType<typeof Ctx>;

    resolveDebounced = debounce((resolve) => resolve(), 400);

    schema = args
        .object()
        .shape({
            description: args.string(),
            gas: args.big().gas(),
            depo: args.big().token(),
            attachment: args.array(),
            tokenAddress: args
                .string()
                .ft()
                .test({
                    name: "whitelisted",
                    message: "Token not whitelisted",
                    test: async (value, ctx) =>
                        value == null ||
                        !(await args.string().ft().isValid(value)) ||
                        ctx.options.context?.tokensWhitelist == null ||
                        ctx.options.context.tokensWhitelist.includes(value),
                })
                .requiredWhen("attachment", (attachment) => attachment.includes("ft")),
            tokenAmount: args
                .big()
                .token()
                .requiredWhen("attachment", (attachment) => attachment.includes("ft")),
            hasErrors: args.boolean().retain({ dummy: true }),
        })
        .transform(({ attachment, gas, gasUnit, depo, depoUnit, tokenAddress, tokenAmount, ...rest }) => ({
            ...rest,
            attachment,
            gas: args.big().intoParsed(gasUnit).cast(gas).toFixed(),
            depo: !attachment.includes("near") ? 0 : args.big().intoParsed(depoUnit).cast(depo).toFixed(),
            ...(attachment.includes("ft") && { tokenAddress, tokenAmount }),
        }))
        .requireAll({ ignore: ["tokenAddress", "tokenAmount"] })
        .retainAll();

    initialValues: FormData = {
        description: "",
        gas: "267.5",
        gasUnit: "Tgas",
        depo: toNEAR("1"),
        depoUnit: "NEAR",
        attachment: [],
        tokenAddress: window.nearConfig.WNEAR_ADDRESS,
        tokenAmount: "1",
        execution: ["immediate"],
        dateTime: new Date(),
    };

    updateFTDebounced = debounce(() => this.tryUpdateFt(), 500);

    constructor(props: Props) {
        super(props);

        this.state = {
            formData: this.initialValues,
            showArgs: false,
            token: new FungibleToken(this.initialValues.tokenAddress),
        };

        this.update = this.update.bind(this);

        document.addEventListener("onaddressesupdated", (e) => this.onAddressesUpdated(e as CustomEvent));
    }

    componentDidMount() {
        window.EXPORT = this;
    }

    setFormData(newFormData: Partial<State["formData"]>, callback?: () => void) {
        this.setState(
            {
                formData: {
                    ...this.state.formData,
                    ...newFormData,
                },
            },
            callback
        );
    }

    onAddressesUpdated(e: CustomEvent) {
        this.tryUpdateFt();
    }

    updateCopyIcon(e: React.MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.innerHTML === "done") return;

        const oldIcon = target.innerHTML;
        target.innerHTML = "done";

        setTimeout(() => {
            target.innerHTML = oldIcon;
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

    private tryUpdateFt(): Promise<boolean> {
        const multicall = window.WALLET_COMPONENT.state.currentMulticall;
        return new Promise<boolean>((resolve) => {
            this.schema
                .check(this.state.formData, {
                    context: { tokensWhitelist: multicall.ready ? multicall.tokensWhitelist : null },
                })
                .then(() => {
                    const { tokenAddress } = fields(this.schema);
                    if (!tokenAddress.isBad()) {
                        this.confidentlyUpdateFt().then((ready) => resolve(ready));
                    } else {
                        this.setState({ token: new FungibleToken(this.state.formData.tokenAddress) }); // will be invalid
                        resolve(false);
                    }
                });
        });
    }

    private async confidentlyUpdateFt(): Promise<boolean> {
        const { tokenAddress } = this.state.formData;
        const newToken = await FungibleToken.init(tokenAddress);
        this.setState({ token: newToken });
        return newToken.ready;
    }

    renderProposeButton(multicallArgs: MulticallArgs) {
        const { selector: walletSelector } = this.context!;
        const wallet = window.WALLET_COMPONENT;

        // if user not logged in, button will do login.
        if (!walletSelector.isSignedIn()) {
            return (
                <button
                    className={clsx(`${_Export}-action`, `${_Export}-action--login`)}
                    onClick={() => window.WALLET_COMPONENT.signIn()}
                >
                    Connect to Wallet
                </button>
            );
        }
        // if specified DAO not have a multicall instance, button will re-direct to DAO page so they can get an instance.
        else if (fields(wallet.schema, "dao").noMulticall.isBad()) {
            return (
                <button
                    className={clsx(`${_Export}-action`, `${_Export}-action--propose`)}
                    disabled
                >
                    {wallet.schema.message()}. <Link to="/dao">Get one now!</Link>
                </button>
            );
        }
        // normal propose multicall to DAO functionality
        else {
            const {
                attachment,
                execution,
                gas,
                gasUnit,
                depo,
                depoUnit,
                description,
                tokenAddress,
                tokenAmount,
                dateTime,
            } = this.state.formData;
            const schema = fields(this.schema);
            const isProposeDisabled =
                wallet.schema.isBad() ||
                schema.depo.isBad() ||
                schema.description.isBad() ||
                schema.hasErrors.isBad() ||
                (this.state.formData.attachment.includes("ft") &&
                    (schema.tokenAddress.isBad() || schema.tokenAmount.isBad()));

            return (
                <button
                    className={clsx(`${_Export}-action`, `${_Export}-action--propose`)}
                    disabled={!!isProposeDisabled}
                    onClick={async () => {
                        const { currentDao: dao, currentMulticall: multicall } = window.WALLET_COMPONENT.state;
                        // Case 1: immediate execution => basic multicall
                        if (!execution.includes("scheduled")) {
                            // multicall with attached FT
                            if (attachment.includes("ft")) {
                                const tx = await dao.proposeMulticallFT(
                                    description,
                                    multicallArgs,
                                    args.big().intoParsed(gasUnit).cast(gas).toFixed(),
                                    tokenAddress,
                                    args
                                        .big()
                                        .intoParsed(this.state.token.metadata.decimals)
                                        .cast(tokenAmount)
                                        .toFixed()
                                );
                                signAndSendTxs([tx]);
                            }
                            // multicall with attached NEAR
                            else {
                                const tx = await dao.proposeMulticall(
                                    description,
                                    multicallArgs,
                                    // if attach NEAR disabled, ignore depo amount and attach 1 yocto.
                                    attachment.includes("near")
                                        ? args.big().intoParsed(depoUnit).cast(depo).toFixed()
                                        : "1",
                                    args.big().intoParsed(gasUnit).cast(gas).toFixed()
                                );
                                signAndSendTxs([tx]);
                            }
                        }
                        // Case2: scheduled execution => use jobs
                        else {
                            // Job with attached FT
                            if (attachment.includes("ft")) {
                                const jobCount = await multicall.getJobCount();
                                const [addJobTx, proposeJobTx] = await Promise.all([
                                    multicall.addJob(
                                        // TODO: support jobs with multiple multicalls
                                        [multicallArgs],
                                        dateTime,
                                        args.big().intoParsed(gasUnit).cast(gas).toFixed()
                                    ),
                                    dao.proposeJobActivationFT(
                                        description,
                                        jobCount,
                                        tokenAddress,
                                        args
                                            .big()
                                            .intoParsed(this.state.token.metadata.decimals)
                                            .cast(tokenAmount)
                                            .toFixed()
                                    ),
                                ]);
                                signAndSendTxs([addJobTx, proposeJobTx]);
                            }
                            // Job with attached NEAR
                            else {
                                const jobCost = attachment.includes("near")
                                    ? args.big().intoParsed(depoUnit).cast(depo).add(Multicall.CRONCAT_FEE).toFixed()
                                    : Multicall.CRONCAT_FEE;
                                const jobCount = await multicall.getJobCount();
                                const [addJobTx, proposeJobTx] = await Promise.all([
                                    multicall.addJob(
                                        // TODO: support jobs with multiple multicalls
                                        [multicallArgs],
                                        dateTime,
                                        args.big().intoParsed(gasUnit).cast(gas).toFixed()
                                    ),
                                    dao.proposeJobActivation(description, jobCount, jobCost),
                                ]);
                                signAndSendTxs([addJobTx, proposeJobTx]);
                            }
                        }
                    }}
                >
                    {`Propose on ${STORAGE.addresses.dao}`}
                    {wallet.schema.isBad() ? <p>{wallet.schema.message()}</p> : <></>}
                </button>
            );
        }
    }

    render() {
        const LAYOUT = this.props.layout; // usually global parameter
        const { showArgs } = this.state;
        const {
            attachment,
            execution,
            gas,
            gasUnit,
            depo,
            depoUnit,
            description,
            tokenAddress,
            tokenAmount,
            dateTime,
        } = this.state.formData;
        const multicall = window.WALLET_COMPONENT.state.currentMulticall;

        // do not schedule jobs in the past
        const currentDate = new Date();
        // limit job scheduling to one year from now
        const maxDate = new Date(new Date().setFullYear(currentDate.getFullYear() + 1));

        // set hasErrors to bad, if there are unresolved errors in the layout
        const allErrors = LAYOUT.toErrors();
        fields(this.schema).hasErrors.isBad(allErrors.length > 0);

        // Multicall args used in making the proposal
        let multicallArgs: MulticallArgs = { calls: [] };
        // Multicall args in text form to display for copy/pasting args
        let multicallArgsText: string = "";

        // toBase64 might throw on failure
        try {
            multicallArgs = { calls: LAYOUT.toBase64() };
            multicallArgsText = !attachment.includes("ft")
                ? JSON.stringify(multicallArgs)
                : JSON.stringify({
                      receiver_id: STORAGE.addresses.multicall,
                      amount: args.big().intoParsed(this.state.token.metadata.decimals).cast(tokenAmount).toFixed(),
                      msg: JSON.stringify({
                          function_id: "multicall",
                          args: Base64.encode(JSON.stringify(multicallArgs).toString()),
                      }).toString(),
                  });
        } catch (e) {
            if (e instanceof CallError)
                multicallArgsText = `Error, could not create multicall arguments: ${e.message} in ${
                    window.TASKS.find((t) => t.id === (e as CallError).taskId)?.instance.current.state.formData.name
                }`;
        }

        return (
            <div className={_Export}>
                <Formik
                    initialValues={this.initialValues}
                    initialTouched={Object.keys(this.state.formData).reduce((acc, k) => ({ ...acc, [k]: true }), {})}
                    validate={async (values) => {
                        this.setFormData({ ...values, dateTime: this.state.formData.dateTime });
                        await new Promise((resolve) => this.resolveDebounced(resolve));
                        await this.tryUpdateFt();
                        await this.schema.check(
                            (({ tokenAmount, ...rest }) => ({
                                ...rest,
                                tokenAmount: this.state.token.ready
                                    ? args
                                          .big()
                                          .intoParsed(this.state.token.metadata.decimals)
                                          .cast(tokenAmount)
                                          ?.toFixed() ?? null
                                    : tokenAmount,
                            }))(values),
                            {
                                context: { tokensWhitelist: multicall.ready ? multicall.tokensWhitelist : null },
                            }
                        );
                        return Object.fromEntries(
                            Object.entries(fields(this.schema))
                                .map(([k, v]) => [k, v?.message() ?? ""])
                                .filter(([_, v]) => v !== "")
                        );
                    }}
                    onSubmit={() => {}}
                >
                    {() => (
                        <Form className={`${_Export}-params`}>
                            <TextField
                                name="description"
                                label="Proposal Description"
                                multiline
                                roundtop
                            />
                            <UnitField
                                name="gas"
                                unit="gasUnit"
                                label="Total allocated gas"
                                options={["Tgas", "gas"]}
                            />
                            <ChoiceField
                                name="attachment"
                                show={(ids) => {
                                    if (ids.includes("near"))
                                        return (
                                            <UnitField
                                                name="depo"
                                                unit="depoUnit"
                                                label="Amount"
                                                options={["NEAR", "yocto"]}
                                            />
                                        );
                                    if (ids.includes("ft"))
                                        return (
                                            <>
                                                <TextField
                                                    name="tokenAddress"
                                                    label="Token Address"
                                                    autocomplete={
                                                        multicall.ready ? multicall.tokensWhitelist : undefined
                                                    }
                                                />
                                                <TextField
                                                    name="tokenAmount"
                                                    label="Amount"
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                {this.state.token.metadata.symbol}
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </>
                                        );
                                }}
                            >
                                {({ isActive, toggle, remove }) => (
                                    <>
                                        <p>Attach</p>
                                        <button
                                            type="button"
                                            className={clsx({ selected: isActive("near") })}
                                            onClick={() => {
                                                toggle("near");
                                                remove("ft");
                                            }}
                                        >
                                            NEAR
                                        </button>
                                        <p>or</p>
                                        <button
                                            type="button"
                                            className={clsx({ selected: isActive("ft") })}
                                            onClick={() => {
                                                remove("near");
                                                toggle("ft");
                                            }}
                                        >
                                            fungible token
                                        </button>
                                    </>
                                )}
                            </ChoiceField>
                            <ChoiceField
                                name="execution"
                                initial={["immediate"]}
                                show={(ids) => {
                                    if (ids.includes("scheduled"))
                                        return (
                                            <div className="spacer">
                                                <DateTimePicker
                                                    classes={{
                                                        input: clsx(`${_Export}-params-scheduleTime`, "roundbottom"),
                                                    }}
                                                    label="Execution date"
                                                    value={dateTime}
                                                    minDateTime={currentDate}
                                                    maxDateTime={maxDate}
                                                    handleChange={(value) =>
                                                        !!value && this.setFormData({ dateTime: value.toJSDate() })
                                                    }
                                                    disableMaskedInput
                                                />
                                            </div>
                                        );
                                }}
                                roundbottom
                            >
                                {({ isActive, choose }) => (
                                    <>
                                        <p>Execute</p>
                                        <button
                                            type="button"
                                            className={clsx({ selected: isActive("immediate") })}
                                            onClick={() => choose("immediate")}
                                        >
                                            immediately
                                        </button>
                                        <p>or</p>
                                        <button
                                            type="button"
                                            className={clsx({ selected: isActive("scheduled") })}
                                            onClick={() => choose("scheduled")}
                                        >
                                            scheduled
                                        </button>
                                    </>
                                )}
                            </ChoiceField>
                        </Form>
                    )}
                </Formik>

                {/* Display cards' errors */}

                {allErrors.length > 0 && (
                    <div className={`${_Export}-errors`}>
                        <div className="header">
                            <h3>{`Card errors (${allErrors.length})`}</h3>
                        </div>

                        <div className="error-list">
                            {allErrors.map((e: any, i: number) => (
                                <div
                                    className="error"
                                    key={`error-${i}`}
                                >
                                    <p className="msg">{`[${e.task.state.formData.name}] Error: ${e.message}`}</p>
                                    <EditOutlinedIcon
                                        className="icon"
                                        onClick={() => {
                                            window.EDITOR.edit(e.task.props.id);
                                            window.MENU.activeTabSwitch(1);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={`${_Export}-section`}>
                    <div className="header">
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
                                onClick={(e: React.MouseEvent) => {
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

                {this.renderProposeButton(multicallArgs)}
            </div>
        );
    }
}
