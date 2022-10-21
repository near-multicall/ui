// TODO: use Multical helper class to fetch & store infos, like admins, tokens etc...

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Icon } from "@mui/material";
import debounce from "lodash.debounce";
import { Component, ContextType } from "react";

import { ArgsAccount, ArgsError } from "../../../shared/lib/args";
import { SputnikDAO } from "../../../shared/lib/contracts/sputnik-dao";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { STORAGE } from "../../../shared/lib/persistent";
import { errorMsg } from "../../../shared/lib/errors";
import { useWalletSelector } from "./providers";
import "./wallet.scss";

const Ctx = useWalletSelector();

interface Props {}

interface State {
    currentDAO: SputnikDAO;
    currentMulticall: Multicall;
    expanded: { user: boolean; dao: boolean };
    color: string;
}

/* TODO: Decompose code */
export class WalletComponent extends Component<Props, State> {
    static contextType = Ctx;
    declare context: ContextType<typeof Ctx>;

    errors: { [key: string]: ArgsError } = {
        noDao: new ArgsError(errorMsg.ERR_NO_DAO_ON_ADDR, (value) => this.errors.noDao.isBad),
        noRights: new ArgsError(errorMsg.ERR_CANNOT_PROPOSE_TO_DAO, (value) => this.errors.noRights.isBad),
        noContract: new ArgsError(errorMsg.ERR_DAO_HAS_NO_MTCL, (value) => this.errors.noContract.isBad),
    };

    daoList: string[] = [];

    daoSearchDebounced = debounce(
        // debounced function
        (newValue) => {
            this.daoSearch(newValue);
        },
        // debounce time
        400
    );

    constructor(props: Props, context: ContextType<typeof Ctx>) {
        super(props, context);

        this.state = {
            currentDAO: new SputnikDAO(STORAGE.addresses.dao),
            currentMulticall: new Multicall(STORAGE.addresses.multicall),
            expanded: {
                user: false,
                dao: false || STORAGE.addresses.dao === "",
            },
            color: "",
        };

        const { accountId } = context!;
        STORAGE.setAddresses({ user: accountId! });
        window.WALLET_COMPONENT = this;
        if (accountId) {
            SputnikDAO.getUserDaosInfo(accountId)
                .then((data) => (this.daoList = data.map((dao) => dao.id)))
                .then(() => this.forceUpdate());
        }
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

    connectDao(daoAddress: SputnikDAO["address"]) {
        const { accountId } = this.context!;

        const { noDao, noRights, noContract } = this.errors;

        noRights.isBad = false;
        noDao.isBad = false;
        noContract.isBad = false;

        const multicallAddress = daoAddress.replace(SputnikDAO.FACTORY_ADDRESS, Multicall.FACTORY_ADDRESS);

        Promise.all([
            // on failure return non-initialized DAO instance (per default: ready = false)
            SputnikDAO.init(daoAddress).catch((e) => new SputnikDAO(daoAddress)),
            Multicall.init(multicallAddress).catch((e) => new Multicall(multicallAddress)),
        ])
            .then(([daoInstance, multicallInstance]) => {
                if (!daoInstance.ready || !multicallInstance.ready) {
                    noDao.isBad = !daoInstance.ready;
                    noContract.isBad = !multicallInstance.ready;
                    window.MENU?.forceUpdate();
                    return;
                }

                this.setState({
                    currentDAO: daoInstance,
                    currentMulticall: multicallInstance,
                });

                // can user propose FunctionCall to DAO?
                const canPropose = daoInstance.checkUserPermission(accountId!, "AddProposal", "FunctionCall");

                if (!canPropose) noRights.isBad = true; // no add proposal rights

                window.MENU?.forceUpdate();
            })
            .finally(() => {
                let color = "red";

                if (ArgsAccount.isValid(daoAddress) && !noDao.isBad) color = "yellow";

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

    daoSearch(newValue: string) {
        STORAGE.setAddresses({}); // hack: empty setAddresses call to invoke callbacks
        if (newValue !== undefined && ArgsAccount.isValid(newValue)) {
            this.connectDao(newValue);
        } else {
            this.setState({ color: newValue === "" ? "" : "red" });
        }
    }

    render() {
        const { selector: walletSelector, accountId } = this.context!;
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
                                    Multicall.FACTORY_ADDRESS
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
