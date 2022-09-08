// TODO: use Multical helper class to fetch & store infos, like admins, tokens etc...

import React, { Component } from "react";
import { view } from "../../utils/wallet";
import { STORAGE } from "../../utils/persistent";
import { useWalletSelector } from "../../contexts/walletSelectorContext";
import { SputnikDAO, ProposalKind, ProposalAction } from "../../utils/contracts/sputnik-dao";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Icon } from "@mui/material";
import "./wallet.scss";
import { ArgsAccount, ArgsError } from "../../utils/args";
import debounce from "lodash.debounce";

export default class Wallet extends Component {
    static contextType = useWalletSelector();

    errors = {
        noDao: new ArgsError(`No sputnik dao found at address`, (value) => this.errors.noDao.isBad),
        noRights: new ArgsError("No permission to create a proposal on this dao", (value) => this.errors.noRights),
        noContract: new ArgsError("Dao does not have a multicall instance", (value) => this.errors.noContract.isBad),
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

    connectDao(dao) {
        const { accountId } = this.context;

        const { noDao, noRights, noContract } = this.errors;

        noRights.isBad = false;
        noDao.isBad = false;
        noContract.isBad = false;

        const multicall = dao.replace(SputnikDAO.FACTORY_ADDRESS, window.nearConfig.MULTICALL_FACTORY_ADDRESS);

        Promise.all([
            SputnikDAO.init(dao).catch((e) => {}),
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
                if (!initializedDAO.ready) {
                    noDao.isBad = true;
                    MENU.forceUpdate();
                    return;
                }

                this.setState({
                    currentDAO: initializedDAO,
                });

                // can user propose FunctionCall to DAO?
                const canPropose = initializedDAO.checkUserPermission(
                    accountId,
                    ProposalAction.AddProposal,
                    ProposalKind.FunctionCall
                );

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
