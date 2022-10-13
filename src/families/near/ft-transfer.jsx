import { InputAdornment } from "@mui/material";
import { args as arx } from "../../shared/lib/args/args";
import { toGas } from "../../shared/lib/converter";
import { FungibleToken } from "../../shared/lib/standards/fungibleToken";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Formik, Form } from "formik";
import { TextField, UnitField } from "../../shared/ui/form-fields";

import { BaseTask } from "../base";

import "./near.scss";

export class Transfer extends BaseTask {
    uniqueClassName = "near-ft-transfer-task";
    schema = arx
        .object()
        .shape({
            tokenAddress: arx.string().tokenContract(),
            receiverId: arx.string().address(),
            amount: arx.big().min("0", "amount must be at least ${min}"),
            memo: arx.string().optional(),
            gas: arx.big().min(toGas("1")).max(toGas("250")),
        })
        .transform(({ gas, gasUnit, ...rest }) => ({
            ...rest,
            gas: arx.big().intoParsed(gasUnit).cast(gas),
        }))
        .requireAll()
        .retainAll();

    initialValues = {
        name: "FT Transfer",
        tokenAddress: window.nearConfig.WNEAR_ADDRESS,
        receiverId: "",
        amount: "0",
        memo: "",
        gas: "10",
        gasUnit: "Tgas",
    };

    constructor(props) {
        super(props);

        this.state = {
            ...this.state,
            formData: this.initialValues,
            token: new FungibleToken(this.initialValues.tokenAddress),
        };

        this.tryUpdateFT();
    }

    init(json = null) {
        (!!json
            ? Object.entries({
                  tokenAddress: json.address,
                  func: json.actions[0].func,
                  args: {
                      receiverId: json.actions[0].args.receiver_id,
                      amount: json.actions[0].args.amount,
                      memo: json.actions[0].args.memo,
                  },
                  gas: arx.big().intoFormatted(this.initialValues.gasUnit).cast(json.actions[0].gas).toFixed(),
                  depo: json.actions[0].depo,
              })
            : []
        ).forEach(([k, v]) => {
            if (v !== undefined && v !== null && this.initialValues[k] !== undefined) this.initialValues[k] = v;
        });

        this.state.formData = this.initialValues;
        this.tryUpdateFT(
            () =>
                (this.state.formData.args.amount = arx
                    .big()
                    .intoFormatted(this.state.token.metadata.decimals)
                    .cast(this.state.formData.amount)
                    .toFixed())
        );
    }

    toCall() {
        const { tokenAddress, receiverId, amount, memo, gas, gasUnit } = this.state.formData;
        const { token } = this.state;

        return {
            address: tokenAddress,
            actions: [
                {
                    func: "ft_transfer",
                    args: {
                        receiver_id: receiverId,
                        amount: arx.big().intoParsed(token.metadata.decimals).cast(amount).toFixed(),
                        memo,
                    },
                    gas: arx.big().intoParsed(gasUnit).cast(gas).toFixed(),
                    depo: "1",
                },
            ],
        };
    }

    static inferOwnType(json) {
        return !!json && arx.string().address().isValidSync(json.address) && json.actions[0].func === "ft_transfer";
    }

    tryUpdateFT(cb) {
        this.schema.check(this.state.formData).then(() => {
            const { tokenAddress } = fields(this.schema);
            if (!tokenAddress.isBad()) {
                this.confidentlyUpdateFT(cb);
            } else {
                this.setState({ token: new FungibleToken(this.state.formData.tokenAddress) }); // will be invalid
            }
        });
    }

    confidentlyUpdateFT(cb) {
        const { tokenAddress } = this.state.formData;
        FungibleToken.init(tokenAddress).then((newToken) => {
            if (!newToken.ready) return;
            this.setState({ token: newToken }, () => {
                cb();
            });
        });
    }

    renderEditor() {
        let init = true;
        return (
            <Formik
                initialValues={this.state.formData}
                initialTouched={Object.keys(this.state.formData).reduce((acc, k) => ({ ...acc, [k]: true }), {})}
                enableReinitialize={true}
                validate={async (values) => {
                    this.setFormData(values);
                    await new Promise((resolve) => this.resolveDebounced(resolve));
                    await new Promise((resolve) => this.tryUpdateFT(resolve));
                    return Object.fromEntries(
                        Object.entries(fields(this.schema))
                            .map(([k, v]) => [k, v?.message() ?? ""])
                            .filter(([_, v]) => v !== "")
                    );
                }}
                onSubmit={() => {}}
            >
                {({ resetForm, validateForm }) => {
                    if (init) {
                        resetForm(this.state.formData);
                        validateForm(this.state.formData);
                        init = false;
                    }
                    return (
                        <Form className="edit">
                            <TextField
                                name="name"
                                label="Card Name"
                                variant="standard"
                                autoFocus
                            />
                            <div className="empty-line" />
                            <TextField
                                name="tokenAddress"
                                label="Token Address"
                                roundTop
                            />
                            <TextField
                                name="receiverId"
                                label="Receiver Address"
                            />
                            <TextField
                                name="amount"
                                label="Amount"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            {this.state.token.metadata.symbol}
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                name="memo"
                                label="Memo"
                            />
                            <UnitField
                                name="gas"
                                unit="gasUnit"
                                options={["Tgas", "gas"]}
                                label="Allocated gas"
                            />
                        </Form>
                    );
                }}
            </Formik>
        );
    }
}
