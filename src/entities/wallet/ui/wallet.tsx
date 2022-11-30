// TODO: use Multicall helper class to fetch & store infos, like admins, tokens etc...

import { Icon } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import debounce from "lodash.debounce";
import { Component, ContextType } from "react";

import { args } from "../../../shared/lib/args/args";
import { fields } from "../../../shared/lib/args/args-types/args-object";
import { SputnikDAO } from "../../../shared/lib/contracts/sputnik-dao";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { STORAGE } from "../../../shared/lib/persistent";

import { tryWalletSelectorContext } from "./providers";
import "./wallet.scss";

enum Color {
    WHITE,
    YELLOW,
    RED,
}

interface Props {}

interface State {
    currentDao: SputnikDAO;
    currentMulticall: Multicall;

    expanded: {
        user: boolean;
        dao: boolean;
    };
    color: Color;
}

/* TODO: Decompose code */
export class WalletComponent extends Component<Props, State> {
    static contextType = tryWalletSelectorContext();
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

    daoList: string[] = [];

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
            currentMulticall: new Multicall(STORAGE.addresses.multicall),
            expanded: {
                user: false,
                dao: false || STORAGE.addresses.dao === "",
            },
            color: Color.WHITE,
        };

        this.schema.check({
            user: accountId ?? "",
            dao: STORAGE.addresses.dao,
        });

        window.WALLET_COMPONENT = this;
        if (accountId) {
            SputnikDAO.getUserDaosInfo(accountId)
                .then((data) => (this.daoList = data.map((dao) => dao.id)))
                .then(() => this.forceUpdate());
        }
    }

    toMulticallAddress(addr: string): string {
        return args
            .string()
            .ensure()
            .intoBaseAddress()
            .append("." + Multicall.FACTORY_ADDRESS)
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

    connectDao(dao: SputnikDAO["address"]) {
        const { accountId } = this.context!;

        const multicallAddress = this.toMulticallAddress(dao);

        Promise.all([
            SputnikDAO.init(dao).catch(() => {
                // return non-initialized DAO obj as ready = false per default.
                return new SputnikDAO(dao);
            }),
            Multicall.init(multicallAddress).catch((e) => new Multicall(multicallAddress)),
        ])
            .then(([newDao, multicallInstance]) => {
                if (!newDao?.ready) return;

                this.setState({
                    currentDao: newDao,
                    currentMulticall: multicallInstance,
                });
            })
            .finally(async () => {
                await this.schema.check({ dao, user: accountId ?? "" });
                const { noDao, noMulticall } = fields(this.schema, "dao");

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
