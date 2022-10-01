import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Icon } from "@mui/material";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import { Component } from "react";

import { ArgsAccount, ArgsError } from "../../../shared/lib/args";
import { SputnikDAO } from "../../../shared/lib/contracts/sputnik-dao";
import { toGas, Big } from "../../../shared/lib/converter";
import { STORAGE } from "../../../shared/lib/persistent";
import { tx, view } from "../../../shared/lib/wallet";
import { errorMsg } from "../../../shared/lib/errors";
import { useWalletSelector } from "./providers";
import "./wallet.scss";

/* TODO: Decompose code */
export class WalletComponent extends Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            currentDAO: new SputnikDAO(STORAGE.addresses.dao),
            expanded: {
                user: false,
                dao: false || STORAGE.addresses.dao === "",
            },
        };

        const { accountId } = context;
        STORAGE.setAddresses({ user: accountId });
        window.WALLET_COMPONENT = this;
        if (accountId) {
            const URL = `https://api.${
                window.NEAR_ENV === "mainnet" ? "" : "testnet."
            }app.astrodao.com/api/v1/daos/account-daos/${accountId}`;
            fetch(URL)
                .then((response) => response.json())
                .then((data) => (this.daoList = data.map((dao) => dao.id)))
                .then(() => this.forceUpdate());
        }
    }

    static contextType = useWalletSelector();

    errors = {
        noDao: new ArgsError(errorMsg.ERR_NO_DAO_ON_ADDR, (value) => this.errors.noDao.isBad),
        noRights: new ArgsError(errorMsg.ERR_CANNOT_PROPOSE_TO_DAO, (value) => this.errors.noRights),
        noContract: new ArgsError(errorMsg.ERR_DAO_HAS_NO_MTCL, (value) => this.errors.noContract.isBad),
    };

    daoList = [];

    daoSearchDebounced = debounce(
        // debounced function
        (newValue) => {
            this.daoSearch(newValue);
        },
        // debounce time
        400
    );

    signIn() {
        const { modal } = this.context;
        modal.show();
    }

    async signOut() {
        const { selector } = this.context;
        const wallet = await selector.wallet();

        wallet.signOut().catch((err) => {
            console.log("Failed to sign out");
            console.error(err);
        });
    }

    propose(desc, depo, gas) {
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
                                args: Base64.encode(JSON.stringify({ calls: LAYOUT.toBase64() })),
                                deposit: `${depo}`,
                                gas: `${gas}`,
                            },
                        ],
                    },
                },
            },
        };

        const { proposal_bond } = this.state.currentDAO.policy;

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
    async proposeFT(desc, gas, token, amount) {
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
                                                JSON.stringify({ calls: LAYOUT.toBase64() }).toString()
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

        const { proposal_bond } = this.state.currentDAO.policy;

        tx(dao, "add_proposal", args, toGas("15"), proposal_bond);
    }

    connectDao(dao: SputnikDAO["address"]) {
        const { accountId } = this.context;

        const { noDao, noRights, noContract } = this.errors;

        noRights.isBad = false;
        noDao.isBad = false;
        noContract.isBad = false;

        const multicall = dao.replace(SputnikDAO.FACTORY_ADDRESS, window.nearConfig.MULTICALL_FACTORY_ADDRESS);

        Promise.all([
            SputnikDAO.init(dao).catch(() => {
                // return non-initialized DAO obj as ready = false per default.
                return new SputnikDAO(dao);
            }),
            view(multicall, "get_admins", {}).catch((e) => {
                if (
                    (e.type === "AccountDoesNotExist" && e.toString().includes(` ${multicall} `)) ||
                    (e.type === "CodeDoesNotExist" && e.toString().includes(`${multicall}`)) ||
                    e.toString().includes("MethodNotFound")
                )
                    noContract.isBad = true;
                else console.error(e, { ...e });

                window.MENU?.forceUpdate();
            }),
        ])
            .then(([initializedDAO, admins]) => {
                if (!initializedDAO?.ready) {
                    noDao.isBad = true;
                    window.MENU?.forceUpdate();
                    return;
                }

                this.setState({
                    currentDAO: initializedDAO,
                });

                // can user propose FunctionCall to DAO?
                const canPropose = initializedDAO.checkUserPermission(accountId, "AddProposal", "FunctionCall");

                if (!canPropose) noRights.isBad = true; // no add proposal rights

                window.MENU?.forceUpdate();
            })
            .finally(() => {
                let color = "red";

                if (ArgsAccount.isValid(dao) && !noDao.isBad) color = "yellow";

                if (!noContract.isBad) color = "";

                this.setState({ color: color });
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

    daoSearch(newValue) {
        STORAGE.setAddresses({}); // hack: empty setAddresses call to invoke callbacks
        if (newValue !== undefined && ArgsAccount.isValid(newValue)) {
            this.connectDao(newValue);
        } else {
            this.setState({ color: newValue === "" ? "" : "red" });
        }
    }

    render() {
        const { selector: walletSelector, accountId } = this.context;
        const { expanded, color } = this.state;

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
                                STORAGE.addresses.dao = newValue ?? "";
                                STORAGE.addresses.multicall = newValue?.replace(
                                    SputnikDAO.FACTORY_ADDRESS,
                                    window.nearConfig.MULTICALL_FACTORY_ADDRESS
                                );
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
