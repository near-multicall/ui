import { InputAdornment } from "@mui/material";
import React from "react";
import { TextInput, TextInputWithUnits } from "../../widgets/editor/elements";
import { ArgsAccount, ArgsBig, ArgsError, ArgsObject, ArgsString } from "../../shared/lib/args-old";
import Call from "../../shared/lib/call";
import { toGas, formatTokenAmount, unitToDecimals } from "../../shared/lib/converter";
import { view } from "../../shared/lib/wallet";
import { errorMsg } from "../../shared/lib/errors";
import { BaseTask } from "../base";
import debounce from "lodash.debounce";
import "./near.scss";

export class Transfer extends BaseTask {
    uniqueClassName = "near-transfer-task";
    errors = {
        ...this.baseErrors,
        addr: new ArgsError(errorMsg.ERR_INVALID_ADDR, (value) => ArgsAccount.isValid(value)),
        func: new ArgsError(errorMsg.ERR_INVALID_FUNC, (value) => value != ""),
        args: new ArgsError(errorMsg.ERR_INVALID_ARGS, (value) => true),
        receiver: new ArgsError(
            "Invalid address",
            (value) => ArgsAccount.isValid(value),
            !ArgsAccount.isValid(this.call.args.value.receiver_id)
        ),
        amount: new ArgsError("Amount out of bounds", (value) => ArgsBig.isValid(value)),
        gas: new ArgsError(errorMsg.ERR_INVALID_GAS_AMOUNT, (value) => ArgsBig.isValid(value)),
        noToken: new ArgsError("Address does not belong to token contract", (value) => this.errors.noToken),
    };

    updateFTDebounced = debounce(() => this.updateFT(), 500);

    constructor(props) {
        super(props);

        this.updateFT();
    }

    init(json = null) {
        const actions = json?.actions?.[0];
        const units = json?.units?.actions?.[0];

        this.call = new Call({
            name: new ArgsString(json?.name ?? "FT Transfer"),
            addr: new ArgsAccount(json?.address ?? window.nearConfig.WNEAR_ADDRESS),
            func: new ArgsString(actions?.func ?? "ft_transfer"),
            args: new ArgsObject(
                actions?.args
                    ? {
                          receiver_id: new ArgsAccount(actions.args.receiver_id),
                          amount: new ArgsBig(
                              formatTokenAmount(actions.args.amount, units?.args.amount.decimals),
                              "0",
                              null,
                              units?.args.amount.unit ?? "unknown",
                              units?.args.amount.decimals
                          ),
                          memo: new ArgsString(actions.args.memo),
                      }
                    : {
                          receiver_id: new ArgsAccount(""),
                          amount: new ArgsBig("0", "0", null, "yocto"),
                          memo: new ArgsString(""),
                      }
            ),
            gas: new ArgsBig(
                formatTokenAmount(actions?.gas ?? toGas("10"), units?.gas.decimals ?? unitToDecimals["Tgas"]),
                toGas("1"),
                toGas("300"),
                units?.gas?.unit ?? "Tgas",
                units?.gas?.decimals
            ),
            depo: new ArgsBig("1", "1", "1", "yocto"),
        });

        this.loadErrors = (() => {
            for (let e in this.baseErrors) this.errors[e].validOrNull(this.call[e]);

            this.errors.receiver.validOrNull(this.call.args.value.receiver_id);
            this.errors.amount.validOrNull(this.call.args.value.amount);

            this.updateFT();
        }).bind(this);
    }

    static inferOwnType(json) {
        // TODO check if address is token address, note requires promise.all in tasks
        return !!json && json.actions[0].func === "ft_transfer";
    }

    updateFT() {
        const { addr, args } = this.call;
        const { amount } = args.value;

        this.errors.noToken.isBad = false;

        if (this.errors.addr.isBad) return;

        view(addr.value, "ft_metadata", {})
            .catch((e) => {
                if (e.type === "AccountDoesNotExist" || e.toString().includes("MethodNotFound"))
                    this.errors.noToken.isBad = true;
            })
            .then((res) => {
                if (res) {
                    if (amount.decimals === null) {
                        amount.value = formatTokenAmount(amount.value, res.decimals);
                    }
                    amount.unit = res.symbol;
                    amount.decimals = res.decimals;
                }
                this.updateCard();
            });
    }

    renderEditor() {
        const { name, addr, gas } = this.call;

        const { receiver_id, amount, memo } = this.call.args.value;

        const errors = this.errors;

        return (
            <div className="edit">
                <TextInput
                    value={name}
                    variant="standard"
                    margin="normal"
                    autoFocus
                    update={this.updateCard}
                />
                <TextInput
                    label="Token address"
                    value={addr}
                    error={[errors.addr, errors.noToken]}
                    update={() => {
                        this.updateCard();
                        this.updateFTDebounced();
                    }}
                />
                <TextInput
                    label="Receiver address"
                    value={receiver_id}
                    error={errors.receiver}
                    update={this.updateCard}
                />
                <TextInput
                    label="Transfer amount"
                    value={amount}
                    error={errors.amount}
                    update={this.updateCard}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">{amount.unit}</InputAdornment>,
                    }}
                />
                <TextInput
                    label="Memo"
                    value={memo}
                    multiline
                    update={this.updateCard}
                />
                <TextInputWithUnits
                    label="Allocated gas"
                    value={gas}
                    error={errors.gas}
                    options={["Tgas", "gas"]}
                    update={this.updateCard}
                />
            </div>
        );
    }
}
