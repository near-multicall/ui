import { Base64 } from 'js-base64';
import React, { Component } from 'react';
import { toGas, Big } from '../../utils/converter';
import { initNear, tx, view } from '../../utils/wallet';
import { SputnikDAO, ProposalKind, ProposalAction } from '../../utils/contracts/sputnik-dao';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Icon } from '@mui/material';
import './wallet.scss';
import { ArgsAccount, ArgsError } from '../../utils/args';
import debounce from 'lodash.debounce'
export default class Wallet extends Component {

    errors = {
        noDao: new ArgsError(`No sputnik dao found at address`, value => this.errors.noDao.isBad),
        noRights: new ArgsError("No permission to create a proposal on this dao", value => this.errors.noRights),
        noContract: new ArgsError("Dao does not have a multicall instance", value => this.errors.noContract.isBad),
    }

    daoList = [];

    daoSearchDebounced = debounce(
        // debounced function
        (newValue) => {
            this.daoSearch(newValue);
        },
        // debounce time
        400
    );

    constructor(props) {

        super(props);

        this.state = {
            wallet: null,
            currentDAO: new SputnikDAO(STORAGE.addresses?.dao ?? ""),
            expanded: {
                user: false,
                dao: false || (STORAGE.addresses.dao === "")
            }
        }

        window.WALLET = initNear()
            .then(wallet => this.setState({
                wallet: wallet,
            }, () => {
                STORAGE.setAddresses({ user: wallet.getAccountId() })
                window.WALLET = this;
                if (wallet.getAccountId() !== "") {
                    const URL = `https://api.${window.NEAR_ENV === "mainnet" ? "" : "testnet."}app.astrodao.com/api/v1/daos/account-daos/${this.state.wallet.getAccountId()}`;
                    fetch(URL)
                        .then(response => response.json())
                        .then(data => this.daoList = data.map(dao => dao.id))
                        .then(() => this.forceUpdate())
                }
            }
            ));
    }

    then(func) { return new Promise(resolve => resolve(func())) } // mock promise

    signIn() {

        this.state.wallet.requestSignIn()

    }

    signOut() {

        this.state.wallet.signOut();
        LAYOUT.forceUpdate();
        this.forceUpdate();

    }

    propose(desc, depo, gas) {

        const {
            multicall,
            dao
        } = STORAGE.addresses

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
                                gas: `${gas}`
                            }
                        ]
                    }
                }
            }
        }

        const { proposal_bond } = this.state.currentDAO.policy;

        tx(
            dao,
            "add_proposal",
            args,
            toGas("15"),
            proposal_bond
        )

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
                                args: Base64.encode(JSON.stringify({
                                    receiver_id: multicall, 
                                    amount: amount,
                                    msg: JSON.stringify({
                                        function_id: "multicall",
                                        args: Base64.encode(JSON.stringify({ "calls": LAYOUT.toBase64() }).toString())
                                    }).toString()
                                })),
                                deposit: "1", // nep-141 specifies EXACTLY 1 yocto
                                gas: gas
                            }
                        ]
                    }
                }
            }
        }

        // check if multicall has enough storage on Token
        const [storageBalance, storageBounds] = await Promise.all([
            // get storage balance of multicall on the token
            view(
                token,
                "storage_balance_of",
                { account_id: multicall }
            ).catch(e => "0"), // return 0 if failed
            // get storage balance bounds in case multicall has no storage on the token and it needs to be paid
            view(
                token,
                "storage_balance_bounds",
                {}
            ).catch(e => {})
        ]);
        const totalStorageBalance = Big(storageBalance?.total ?? "0");
        const storageMinBound = Big(storageBounds.min);

        // if storage balance is less than minimum bound, add proposal action to pay for storage
        if (totalStorageBalance.lt(storageMinBound)) {
            // push to beginning of actions array. Has to execute before ft_transfer_call
            args.proposal.kind.FunctionCall.actions.unshift(
                {
                    method_name: "storage_deposit",
                    args: Base64.encode( JSON.stringify(
                        { account_id: multicall }
                    )),
                    deposit: storageMinBound.sub(totalStorageBalance).toFixed(), // difference between current storage total and required minimum
                    gas: toGas("5") // 5 Tgas
                }
            );
        }

        const { proposal_bond } = this.state.currentDAO.policy;

        tx(
            dao,
            "add_proposal",
            args,
            toGas("15"),
            proposal_bond
        )

    }

    connectDao(dao) {

        const {
            noDao,
            noRights,
            noContract
        } = this.errors;

        noRights.isBad = false;
        noDao.isBad = false;
        noContract.isBad = false;

        const multicall = dao.replace(SputnikDAO.FACTORY_ADDRESS, window.nearConfig.MULTICALL_FACTORY_ADDRESS);

        Promise.all([
            SputnikDAO.init(dao).catch(e => {}),
            view(multicall, "get_admins", {})
                .catch(e => {

                    if (e.type === "AccountDoesNotExist" && e.toString().includes(` ${multicall} `) ||
                        e.type === "CodeDoesNotExist" && e.toString().includes(`${multicall}`) ||
                        e.toString().includes("MethodNotFound"))
                        noContract.isBad = true;
                    else
                        console.error(e, { ...e })

                    window.MENU?.forceUpdate()

                })
        ])
            .then(([initializedDAO, admins]) => {

                if (!initializedDAO.ready) {
                    noDao.isBad = true;
                    MENU.forceUpdate()
                    return;
                }

                this.setState({
                    currentDAO: initializedDAO
                });

                // can user propose FunctionCall to DAO?
                const canPropose = initializedDAO.checkUserPermission(
                    window.account.accountId,
                    ProposalAction.AddProposal,
                    ProposalKind.FunctionCall
                );

                if (!canPropose) noRights.isBad = true; // no add proposal rights

                window.MENU?.forceUpdate()

            })
            .finally(() => {

                let color = "red";

                if (ArgsAccount.isValid(dao) && !noDao.isBad)
                    color = "yellow";

                if (!noContract.isBad)
                    color = "";

                this.setState({ color: color });

            })

    }

    toggleExpandedDao() {

        const { expanded } = this.state;

        this.setState({
            expanded: {
                user: expanded.user,
                dao: !expanded.dao
            }
        })

    }

    toggleExpandedUser() {

        const { expanded } = this.state;

        this.setState({
            expanded: {
                user: !expanded.user,
                dao: expanded.dao
            }
        })

    }

    daoSearch(newValue) {
        STORAGE.setAddresses({}); // hack: empty setAddresses call to invoke callbacks
        if (newValue !== undefined && ArgsAccount.isValid(newValue)) {
            this.connectDao(newValue);
        }
        else {
            this.setState({ color: newValue === "" ? "" : "red" });
        }
    }

    render() {

        const { wallet, expanded, color } = this.state;

        if (!wallet)
            return null;


        return (
            <div
                className="wallet"
            >
                <div className="user" expand={expanded.user || !wallet.isSignedIn() ? "yes" : "no"}>
                    <Icon
                        className="icon"
                        onClick={() => this.toggleExpandedUser()}
                    >
                        {expanded.user && wallet.isSignedIn() ? "chevron_left" : "person"}
                    </Icon>
                    <div className="peek">
                        {wallet.getAccountId()}
                    </div>
                    <div className="expand">
                        {wallet.isSignedIn()
                            ? <>
                                {wallet.getAccountId()}
                                <button
                                    className="logout"
                                    onClick={() => this.signOut()}
                                >
                                    sign out
                                </button>
                            </>
                            : <button onClick={() => this.signIn()}>sign in</button>
                        }
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
                            className='dao-selector'
                            freeSolo
                            value={STORAGE.addresses.dao}
                            options={this.daoList}
                            renderInput={(params) =>
                                <TextField
                                    {...params}
                                    placeholder="Select DAO"
                                />
                            }
                            onInputChange={(e, newValue) => {
                                // set STORAGE.addresses to have no delay, thus no rubber banding
                                STORAGE.addresses.dao = newValue ?? "";
                                STORAGE.addresses.multicall = newValue?.replace(SputnikDAO.FACTORY_ADDRESS, window.nearConfig.MULTICALL_FACTORY_ADDRESS);
                                this.daoSearchDebounced(newValue)
                            }}
                        />
                    </div>
                    <div className="peek">
                        {STORAGE?.addresses?.dao ?? ""}
                    </div>
                </div>
            </div>
        );

    }

}