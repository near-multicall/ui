import { Icon } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import { Component, ContextType } from "react";

import { args } from "../../../shared/lib/args/args";
import { fields } from "../../../shared/lib/args/args-types/args-object";
import { SputnikDAO } from "../../../shared/lib/contracts/sputnik-dao";
import { Big, toGas } from "../../../shared/lib/converter";
import { STORAGE } from "../../../shared/lib/persistent";
import { tx, view } from "../../../shared/lib/wallet";
import { useWalletSelector } from "./providers";
import "./wallet.scss";

enum Color {
    WHITE,
    YELLOW,
    RED,
}

interface Props {}

interface State {
    currentDao: SputnikDAO;
    expanded: {
        user: boolean;
        dao: boolean;
    };
    color: Color;
}

/* TODO: Decompose code */
export class WalletComponent extends Component<Props, State> {
    static contextType = useWalletSelector();
    declare context: ContextType<typeof WalletComponent.contextType>;

    schema = args
        .object()
        .shape({
            user: args
                .string()
                .address()
                .test({
                    name: "hasPermission",
                    message: "User does not have required permissions on this dao",
                    test: (value) =>
                        value == null ||
                        this.state.currentDao.checkUserPermission(value, "AddProposal", "FunctionCall"),
                })
                .retain(),
            dao: args
                .object()
                .shape({
                    noDao: args.string().sputnikDao().retain({ initial: true }),
                    noMulticall: args.string().multicall().retain({
                        customMessage: "DAO does not have a multicall instance",
                        initial: true,
                    }),
                })
                .transform((_, addr) => ({
                    noAddress: addr,
                    noMulticall: this.toMulticallAddress(addr),
                }))
                .retain(),
        })
        .retain();

    daoList = [];

    daoSearchDebounced = debounce(
        // debounced function
        (newValue) => {
            this.daoSearch(newValue);
        },
        // debounce time
        400
    );

    constructor(props: Props, context: ContextType<typeof WalletComponent.contextType>) {
        super(props);

        const { accountId } = context!;
        STORAGE.setAddresses({ user: accountId ?? "" });

        this.state = {
            currentDao: new SputnikDAO(STORAGE.addresses.dao),
            expanded: {
                user: false,
                dao: false || STORAGE.addresses.dao === "",
            },
            color: Color.WHITE,
        };

        this.schema.check({
            user: accountId,
            dao: STORAGE.addresses.dao,
        });

        window.WALLET_COMPONENT = this;
        if (accountId) {
            const URL = `https://api.${
                window.NEAR_ENV === "mainnet" ? "" : "testnet."
            }app.astrodao.com/api/v1/daos/account-daos/${accountId}`;
            fetch(URL)
                .then((response) => response.json())
                .then((data) => (this.daoList = data.map((dao: { id: number }) => dao.id)))
                .then(() => this.forceUpdate());
        }
    }

    toMulticallAddress(addr: string): string {
        return args
            .string()
            .ensure()
            .intoBaseAddress()
            .append("." + window.nearConfig.MULTICALL_FACTORY_ADDRESS)
            .cast(addr);
    }

    signIn() {
        const { modal } = this.context!;
        modal.show();
    }

    async signOut() {
        const { selector } = this.context!;
        const wallet = await selector.wallet();

        wallet.signOut().catch((err) => {
            console.log("Failed to sign out");
            console.error(err);
        });
    }

    propose(desc: string, depo: string, gas: string) {
        const { multicall, dao } = STORAGE.addresses;

        const args = {
            proposal: {
                description: desc,
                kind: {
                    FunctionCall: {
                        receiver_id: multicall,
                        actions: [
                            {
                                method_name: "multicall",
                                args: Base64.encode(JSON.stringify({ calls: window.LAYOUT.toBase64() })),
                                deposit: `${depo}`,
                                gas: `${gas}`,
                            },
                        ],
                    },
                },
            },
        };

        const { proposal_bond } = this.state.currentDao.policy;

        tx(dao, "add_proposal", args, toGas("15"), proposal_bond);
    }

    /**
     * propose multicall with attached FT
     *
     * @param {string} desc DAO proposal description
     * @param {string} gas gas for the multicall action
     * @param {string} token attached FT address
     * @param {string} amount attached FT amount
     */
    async proposeFT(desc: string, gas: string, token: string, amount: string) {
        const { multicall, dao } = STORAGE.addresses;

        const args = {
            proposal: {
                description: desc,
                kind: {
                    FunctionCall: {
                        receiver_id: token,
                        actions: [
                            {
                                method_name: "ft_transfer_call",
                                args: Base64.encode(
                                    JSON.stringify({
                                        receiver_id: multicall,
                                        amount: amount,
                                        msg: JSON.stringify({
                                            function_id: "multicall",
                                            args: Base64.encode(
                                                JSON.stringify({ calls: window.LAYOUT.toBase64() }).toString()
                                            ),
                                        }).toString(),
                                    })
                                ),
                                deposit: "1", // nep-141 specifies EXACTLY 1 yocto
                                gas: gas,
                            },
                        ],
                    },
                },
            },
        };

        // check if multicall has enough storage on Token
        const [storageBalance, storageBounds] = await Promise.all([
            // get storage balance of multicall on the token
            view(token, "storage_balance_of", { account_id: multicall }).catch((e) => "0"), // return 0 if failed
            // get storage balance bounds in case multicall has no storage on the token and it needs to be paid
            view(token, "storage_balance_bounds", {}).catch((e) => {}),
        ]);
        const totalStorageBalance = Big(storageBalance?.total ?? "0");
        const storageMinBound = Big(storageBounds.min);

        // if storage balance is less than minimum bound, add proposal action to pay for storage
        if (totalStorageBalance.lt(storageMinBound)) {
            // push to beginning of actions array. Has to execute before ft_transfer_call
            args.proposal.kind.FunctionCall.actions.unshift({
                method_name: "storage_deposit",
                args: Base64.encode(JSON.stringify({ account_id: multicall })),
                deposit: storageMinBound.sub(totalStorageBalance).toFixed(), // difference between current storage total and required minimum
                gas: toGas("5"), // 5 Tgas
            });
        }

        const { proposal_bond } = this.state.currentDao.policy;

        tx(dao, "add_proposal", args, toGas("15"), proposal_bond);
    }

    connectDao(dao: string) {
        const { accountId } = this.context!;
        const { noDao, noMulticall } = fields(this.schema, "dao");

        Promise.all([
            SputnikDAO.init(dao).catch(() => {
                // return non-initialized DAO obj as ready = false per default.
                return new SputnikDAO(dao);
            }),
            this.schema.check({ dao }),
        ])
            .then(([newDao]) => {
                if (!newDao?.ready) return;

                this.setState({
                    currentDao: newDao,
                });

                this.schema.check({ user: accountId });
            })
            .finally(() => {
                let color = Color.RED;
                if (!noDao.isBad()) color = Color.YELLOW;
                if (!noMulticall.isBad()) color = Color.WHITE;

                this.setState({ color });
                window.MENU?.forceUpdate();
            });
    }

    toggleExpandedDao() {
        const { expanded } = this.state;

        this.setState({
            expanded: {
                user: expanded.user,
                dao: !expanded.dao,
            },
        });
    }

    toggleExpandedUser() {
        const { expanded } = this.state;

        this.setState({
            expanded: {
                user: !expanded.user,
                dao: expanded.dao,
            },
        });
    }

    daoSearch(newDao: string) {
        STORAGE.setAddresses({}); // hack: empty setAddresses call to invoke callbacks
        if (args.string().address().isValidSync(newDao)) {
            this.connectDao(newDao);
        } else {
            this.setState({ color: newDao === "" ? Color.WHITE : Color.RED });
        }
    }

    render() {
        const { selector: walletSelector, accountId } = this.context!;
        const { expanded, color: enumColor } = this.state;

        const color = {
            [`${Color.WHITE}`]: "",
            [`${Color.YELLOW}`]: "yellow",
            [`${Color.RED}`]: "red",
        }[enumColor];

        if (!walletSelector) return null;

        return (
            <div className="wallet">
                <div
                    className="user"
                    expand={expanded.user || !walletSelector.isSignedIn() ? "yes" : "no"}
                >
                    <Icon
                        className="icon"
                        onClick={() => this.toggleExpandedUser()}
                    >
                        {expanded.user && walletSelector.isSignedIn() ? "chevron_left" : "person"}
                    </Icon>

                    <div className="peek">{accountId}</div>

                    <div className="expand">
                        {walletSelector.isSignedIn() ? (
                            <>
                                {accountId}
                                <button
                                    className="logout"
                                    onClick={() => this.signOut()}
                                >
                                    sign out
                                </button>
                            </>
                        ) : (
                            <button onClick={() => this.signIn()}>sign in</button>
                        )}
                    </div>
                </div>

                <span>for</span>

                <div
                    className={`dao ${color}`}
                    expand={expanded.dao ? "yes" : "no"}
                >
                    <Icon
                        className="icon"
                        onClick={() => this.toggleExpandedDao()}
                    >
                        {expanded.dao && STORAGE.addresses.dao !== "" ? "chevron_left" : "groups"}
                    </Icon>

                    <div className="expand">
                        <Autocomplete
                            className="dao-selector"
                            freeSolo
                            value={STORAGE.addresses.dao}
                            options={this.daoList}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select DAO"
                                />
                            )}
                            onInputChange={(e, newValue) => {
                                // set STORAGE.addresses to have no delay, thus no rubber banding
                                STORAGE.addresses.dao = newValue;
                                STORAGE.addresses.multicall = this.toMulticallAddress(newValue);
                                this.daoSearchDebounced(newValue);
                            }}
                        />
                    </div>

                    <div className="peek">{STORAGE.addresses.dao}</div>
                </div>
            </div>
        );
    }
}
