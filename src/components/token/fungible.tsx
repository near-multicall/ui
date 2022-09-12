import { InputAdornment, Tab, TabProps } from "@mui/material";
import { DeleteOutline, EditOutlined, AddOutlined, PauseOutlined, PlayArrowOutlined } from "@mui/icons-material";
import { Base64 } from "js-base64";
import debounce from "lodash.debounce";
import * as nearAPI from "near-api-js";
import React, { Component } from "react";

import { TokenLabel } from "../../shared/ui/components/token-label/token-label";
import { ArgsAccount, ArgsError } from "../../utils/args";
import { STORAGE } from "../../utils/persistent";
import { toNEAR, toYocto, Big, formatTokenAmount } from "../../utils/converter";
import { view, viewAccount } from "../../utils/wallet";
import { useWalletSelector } from "../../contexts/walletSelectorContext";
import { SputnikDAO, SputnikUI, ProposalKind, ProposalAction } from "../../utils/contracts/sputnik-dao";
import { TextInput } from "../editor/elements";
import { FungibleToken } from "../../utils/standards/fungibleToken";
import { Table } from "../../shared/ui/components/table";
import { Tabs } from "../../shared/ui/components/tabs";

export const FungibleTokenBalances = ({ className }: { className?: string }) => {
    return (
        <div {...{ className }}>
            <h1 className="title">Fungible Token Balances</h1>

            <Table
                header={["Token", "Multicall", "DAO", "Total"]}
                rows={fungibleTokenBalances}
            />
        </div>
    );
};
