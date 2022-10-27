import { DeleteOutline, EditOutlined, PauseOutlined, PlayArrowOutlined } from "@mui/icons-material";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import { Component, ContextType } from "react";

import { Form, Formik } from "formik";
import { Wallet } from "../../entities";
import { args } from "../../shared/lib/args/args";
import { fields } from "../../shared/lib/args/args-types/args-object";
import { Multicall } from "../../shared/lib/contracts/multicall";
import type { ProposalOutput } from "../../shared/lib/contracts/sputnik-dao";
import { SputnikDAO, SputnikUI } from "../../shared/lib/contracts/sputnik-dao";
import { Big, toGas, toYocto } from "../../shared/lib/converter";
import { STORAGE } from "../../shared/lib/persistent";
import { signAndSendTxs } from "../../shared/lib/wallet";
import { Tabs } from "../../shared/ui/components";

import { TextField } from "../../shared/ui/form-fields";
import { DaoConfigTab } from "./config/config";
import "./dao.scss";
import { DaoFundsTab } from "./funds/funds";
import { DaoJobsTab } from "./jobs/jobs";

// minimum balance a multicall instance needs for storage + state.
const MIN_INSTANCE_BALANCE = toYocto(1); // 1 NEAR
const Ctx = Wallet.useSelector();

interface Props {}

interface State {
    formData: {
        addr: string;
    };
    dao: SputnikDAO;
    multicall: Multicall;
    loading: boolean;
    proposed: number;
    proposedInfo: ProposalOutput | null;
}

const _DaoPage = "DaoPage";
export class DaoPage extends Component<Props, State> {
    static contextType = Ctx;
    declare context: ContextType<typeof Ctx>;

    schema = args
        .object()
        .shape({
            addr: args
                .object()
                .shape({
                    noAddress: args.string().address().retain({ initial: true }),
                    noDao: args.string().sputnikDao().retain({ initial: true }),
                    noMulticall: args.string().multicall().retain({
                        customMessage: "DAO does not have a multicall instance",
                        initial: true,
                    }),
                })
                .transform((_, addr) => ({
                    noAddress: addr,
                    noDao: addr,
                    noMulticall: this.toMulticallAddress(addr),
                }))
                .retain(),
        })
        .retain();

    tryLoadInfoDebounced = debounce(() => this.tryLoadInfo(), 400);

    lastAddr: string | null;
    fee: string = "";
    formikSetValues?: (fields: State["formData"], shouldValidate?: boolean) => void;

    constructor(props: Props) {
        super(props);

        const addr = STORAGE.addresses.dao;

        this.state = {
            formData: {
                addr,
            },

            dao: new SputnikDAO(addr),
            multicall: new Multicall(this.toMulticallAddress(addr)),

            loading: false,
            proposed: -1,
            proposedInfo: null,
        };

        this.schema.check(this.state.formData);

        Multicall.getFactoryFee().then((multicallFactoryFee) => {
            this.fee = multicallFactoryFee;
            this.tryLoadInfo();
        });

        this.lastAddr = null;
    }

    componentDidMount() {
        window.SIDEBAR.switchPage("dao");
        document.addEventListener("onaddressesupdated", (e) => this.onAddressesUpdated(e as CustomEvent));
    }

    setFormData(newFormData: State["formData"], callback?: () => void | undefined) {
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

    toMulticallAddress(addr: string): string {
        return args
            .string()
            .ensure()
            .intoBaseAddress()
            .append("." + Multicall.FACTORY_ADDRESS)
            .cast(addr);
    }

    /**
     * check if DAO has a proposal to create multicall instance.
     * proposal must be in progress, and not expired.
     *
     * @returns {object} ID and info of proposal to create multicall instance,
     */
    async proposalAlreadyExists(
        dao: SputnikDAO
    ): Promise<{ proposal_id: number; proposal_info: ProposalOutput | null }> {
        // Date.now() returns timestamp in milliseconds, SputnikDAO uses nanoseconds
        const currentTime = Big(Date.now()).times("1000000");
        const lastProposalId = dao.lastProposalId;
        const proposalPeriod = dao.policy.proposal_period;

        // get last 100 DAO proposals
        const proposals = await dao.getProposals({
            from_index: lastProposalId < 100 ? 0 : lastProposalId - 100,
            limit: 100,
        });
        // Look for active "Create multicall" proposals
        const activeProposals = proposals.filter(
            (proposal) =>
                // discard if not active proposal to create multicall instance

                proposal.kind?.FunctionCall?.receiver_id === Multicall.FACTORY_ADDRESS &&
                proposal.kind?.FunctionCall?.actions?.[0]?.method_name === "create" &&
                proposal.status === "InProgress" &&
                Big(proposal.submission_time).add(proposalPeriod).gt(currentTime)
        );

        // If there many "Create multicall" proposals, return latest.
        if (activeProposals.length > 0) {
            const lastProposal = activeProposals.pop()!;
            return { proposal_id: lastProposal.id, proposal_info: lastProposal };
        }
        // No "Create multicall" proposals found.
        else return { proposal_id: -1, proposal_info: null };
    }

    onAddressesUpdated(e: CustomEvent<{ dao: string }>) {
        if (e.detail.dao !== this.state.formData.addr) {
            this.setState({
                multicall: new Multicall(this.toMulticallAddress(e.detail.dao)),
            });
            this.formikSetValues?.({ addr: e.detail.dao });
        }
    }

    createMulticall() {
        const { accountId } = this.context!;
        const { loading, dao, proposed, proposedInfo, formData } = this.state;
        const { noMulticall, noDao } = fields(this.schema, "addr");

        console.log(this.state);

        if (
            this.fee === "" ||
            // wallet not logged in or DAO object not initialized yet
            dao?.ready !== true
        ) {
            return null;
        }

        const multicallAddress = this.toMulticallAddress(formData.addr);

        const depo = Big(this.fee).plus(MIN_INSTANCE_BALANCE);
        const daoSearchInput: HTMLInputElement = document.querySelector(".DaoSearch input")!;

        // can user propose a FunctionCall to DAO?
        const canPropose = dao.checkUserPermission(accountId!, "AddProposal", "FunctionCall");

        // can user vote approve a FunctionCall on the DAO?
        const canApprove = dao.checkUserPermission(accountId!, "VoteApprove", "FunctionCall");

        const args = {
            proposal: {
                description: `create multicall instance for this DAO at ${multicallAddress}`,
                kind: {
                    FunctionCall: {
                        receiver_id: Multicall.FACTORY_ADDRESS,

                        actions: [
                            {
                                method_name: "create",
                                args: Base64.encode(
                                    JSON.stringify({
                                        multicall_init_args: {
                                            admin_accounts: [dao.address],
                                            croncat_manager: window.nearConfig.CRONCAT_MANAGER_ADDRESS,
                                            job_bond: dao.policy.proposal_bond,
                                        },

                                        public_key: "HdJuXFRBKMEXuzEsXVscdd3aoBvEGGXDKQ3JoNhqJ4uU",
                                    })
                                ),

                                deposit: depo.toFixed(),
                                gas: toGas("150"),
                            },
                        ],
                    },
                },
            },
        };

        if (
            noMulticall.isBad() &&
            !noDao.isBad() && // base.sputnik-dao.near does not exist
            !loading &&
            // disappear while debouncing
            this.lastAddr === daoSearchInput.value
        ) {
            if (proposed === -1) {
                // no create multicall proposal exists

                if (canPropose) {
                    // ... and user can propose FunctionCall

                    return (
                        <>
                            <div className="Alert">
                                {/* hint: you can use "genesis" or "test" as DAO to get to this message */}
                                {`A multicall instance can only be created for `}

                                <a
                                    href={dao.getDaoUrl(SputnikUI.ASTRO_UI)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {dao.address}
                                </a>

                                {` by making a proposal.`}
                            </div>

                            <button
                                className="create-multicall"
                                onClick={() => {
                                    dao.addProposal(args).then((tx) => signAndSendTxs([tx]));
                                }}
                            >
                                Propose
                            </button>
                        </>
                    );
                } else {
                    // ... and user cannot propose FunctionCall

                    return (
                        <div className="Alert">
                            {/* hint: you can use "ref-community-board-testnet" as DAO to get to this message */}
                            {`This DAO has no multicall instance. A DAO member with proposing permissions should make a proposal.`}
                        </div>
                    );
                }
            } else if (proposed !== -1) {
                // create multicall proposal exists

                if (!canApprove) {
                    // user does not have rights to VoteApprove

                    return (
                        <div className="Alert">
                            {`Proposal to create a multicall exists (#${proposed}), but you have no voting permissions on this DAO.`}
                            <br />
                            <a
                                target="_blank"
                                href={dao.getProposalUrl(SputnikUI.ASTRO_UI, proposed)}
                                rel="noopener noreferrer"
                            >
                                Proposal on Astro
                            </a>
                        </div>
                    );
                } else if (proposedInfo?.votes[accountId!]) {
                    // user can VoteApprove and already voted

                    return (
                        <div className="Alert">
                            {`You have voted on creating a multicall instance for this DAO. It will be created as soon as the proposal passes voting.`}
                            <br />
                            <a
                                target="_blank"
                                href={dao.getProposalUrl(SputnikUI.ASTRO_UI, proposed)}
                                rel="noopener noreferrer"
                            >
                                Proposal on Astro
                            </a>
                        </div>
                    );
                } else {
                    // user can VoteApprove and did NOT vote yet.

                    return (
                        <>
                            <div className="Alert">
                                {/* hint: you can use "genesis" or "test" as DAO to get to this message */}
                                {`There exists a proposal (#${proposed}) to create a multicall instance for this DAO. `}

                                <a
                                    href={dao.getProposalUrl(SputnikUI.ASTRO_UI, proposed)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open on AstroDAO
                                </a>
                            </div>

                            <button
                                className="create-multicall proposal-exists"
                                onClick={() => {
                                    dao.actProposal(proposed, "VoteApprove").then((tx) => signAndSendTxs([tx]));
                                }}
                            >
                                {`vote YES`}
                            </button>
                        </>
                    );
                }
            }
        }
    }

    toLink(address: string, deleteIcon = true) {
        return (
            <span>
                <a
                    href={args.string().address().intoUrl().cast(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {address}
                </a>
                {deleteIcon ? <DeleteOutline /> : null}
            </span>
        );
    }

    job(job: any) {
        return (
            <div className="JobsList-item">
                <EditOutlined />
                <DeleteOutline />
                {job.is_active ? <PauseOutlined /> : <PlayArrowOutlined />}
                <pre>{JSON.stringify(job, null, "  ")}</pre>
            </div>
        );
    }

    tryLoadInfo() {
        if (this.lastAddr === this.state.formData.addr) return;
        this.lastAddr = this.state.formData.addr;
        this.schema.check(this.state.formData).then(() => {
            const { noDao } = fields(this.schema, "addr");
            if (!this.schema.isBad()) {
                // case 0: DAO and Multicall exist
                this.confidentlyLoadInfo();
            } else if (!noDao.isBad()) {
                // case 1: Only DAO exists
                this.confidentlyLoadOnlyDaoInfo();
            } else {
                // case 2: neither exist
                this.setState({
                    proposed: -1,
                    proposedInfo: null,
                    dao: new SputnikDAO(this.state.formData.addr), // will be invalid
                });
            }
        });
    }

    confidentlyLoadOnlyDaoInfo() {
        const { addr } = this.state.formData;

        const multicallAddress = this.toMulticallAddress(addr);

        this.setState({ loading: true });

        // initialize DAO object
        SputnikDAO.init(addr)
            .catch((e) => new SputnikDAO(addr))
            .then((newDao) => {
                if (!newDao) return;
                // some error happened during DAO object init.
                if (!newDao.ready) {
                    this.setState({
                        dao: newDao,
                        multicall: new Multicall(multicallAddress),
                        loading: false,
                    });
                    return;
                } else {
                    this.proposalAlreadyExists(newDao)
                        .catch((e) => {})
                        .then((proposalData) =>
                            this.setState({
                                dao: newDao,
                                multicall: new Multicall(multicallAddress),
                                loading: false,
                                proposed: proposalData?.proposal_id || -1,
                                proposedInfo: (proposalData?.proposal_info as ProposalOutput) || null,
                            })
                        );
                }
            });
    }

    confidentlyLoadInfo() {
        const { addr: daoAddress } = this.state.formData;

        const multicallAddress = this.toMulticallAddress(daoAddress);

        this.setState({ loading: true });

        Promise.all([
            SputnikDAO.init(daoAddress).catch((e) => new SputnikDAO(daoAddress)),
            Multicall.init(multicallAddress).catch((e) => new Multicall(multicallAddress)),
        ]).then(([newDao, newMulticall]) => {
            if (!newDao || !newMulticall) return;
            // some error happened during DAO object init.
            if (!newDao.ready || !newMulticall.ready) {
                this.setState({
                    dao: newDao,
                    multicall: newMulticall,
                    loading: false,
                });
            } else {
                this.proposalAlreadyExists(newDao)
                    .catch((e) => {})
                    .then((proposalData) =>
                        this.setState({
                            dao: newDao,
                            multicall: newMulticall,
                            loading: false,
                            proposed: proposalData?.proposal_id || -1,
                            proposedInfo: (proposalData?.proposal_info as ProposalOutput) || null,
                        })
                    );
            }
        });
    }

    getContent() {
        const { selector: walletSelector } = this.context!;
        const { dao, loading, multicall } = this.state;

        // if user not logged in, remind them to sign in.
        // TODO: only require signIn when DAO has no multicall instance (to know if user can propose or vote on existing proposal to create multicall)
        if (!walletSelector.isSignedIn()) {
            return <div className="DaoPage-content error">Please sign in to continue</div>;
        }

        // errors to display
        const displayErrorsList = ["noAddress", "noDao", "noMulticall"];
        const displayErrors = Object.entries(fields(this.schema, "addr"))
            .filter(([k, v]) => v.isBad() && displayErrorsList.includes(k))
            .map(([k, v]) => (
                <p
                    key={`p-${k}`}
                    className={"red"}
                >
                    <span>{v.isBad() ? "\u2717" : "\u2714"} </span>
                    {v.message()}
                </p>
            ));

        if (displayErrors.length > 0)
            return (
                <>
                    <div className="DaoPage-content error">
                        <div>{displayErrors}</div>
                        {this.createMulticall()}
                    </div>
                </>
            );

        if (loading) return <div className="DaoPage-content loader" />;

        // everything should be loaded
        if (!multicall.admins || !multicall.tokensWhitelist || !multicall.jobBond) {
            console.error("multicall infos incomplete", multicall);
            return <div className="DaoPage-content error">Unexpected error! Multicall might be outdated.</div>;
        }

        return (
            <Tabs
                classes={{ buttonsPanel: "DaoPage-tabs-buttonsPanel", contentSpace: "DaoPage-tabs-contentSpace" }}
                items={[
                    DaoConfigTab.connect({ className: `${_DaoPage}-content`, contracts: { multicall } }),
                    DaoFundsTab.connect({ className: `${_DaoPage}-content`, contracts: { dao, multicall } }),
                    DaoJobsTab.connect({ className: `${_DaoPage}-content`, contracts: { multicall } }),
                ]}
            />
        );
    }

    render() {
        return (
            <div className="DaoPage">
                <div className="DaoPage-header">
                    <div className="DaoSearch">
                        <Formik
                            initialValues={{ addr: STORAGE.addresses.dao ?? "" }}
                            validate={(values) => {
                                this.setFormData({ addr: values.addr });
                                this.tryLoadInfoDebounced();
                            }}
                            onSubmit={() => {}}
                        >
                            {({ setValues }) => {
                                this.formikSetValues = setValues;

                                return (
                                    <Form>
                                        <TextField
                                            name="addr"
                                            placeholder="Seach for DAOs"
                                            hiddenLabel={true}
                                            variant="standard"
                                            autoFocus
                                        />
                                    </Form>
                                );
                            }}
                        </Formik>
                    </div>
                </div>

                {this.getContent()}
            </div>
        );
    }
}
