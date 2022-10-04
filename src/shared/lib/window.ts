import * as nearAPI from "near-api-js";
import type { NetworkId } from "@near-wallet-selector/core";
import { Component } from "react";

import { Task, Layout, Sidebar } from "../../widgets";

type CardInfo = {
    call: object;
    showArgs: boolean;
    options: object;
    errors: object;
};

type CardCopy = {
    from: string;
    to: string;
    payload?: CardInfo;
};

declare global {
    interface Window {
        // Page components
        DAO: Component;

        MENU: Component;
        EDITOR: Component;
        EXPORT: Component;

        LAYOUT: Layout;
        SIDEBAR: Sidebar;

        // List of all mounted tasks
        TASKS: Array<Task>;

        // Temporary storage for moving and cloning cards
        TEMP: CardInfo | null;
        COPY: CardCopy | null;

        // Wallet definitions
        WALLET_COMPONENT: Promise<nearAPI.WalletConnection> | Component;
        NEAR_ENV: NetworkId;
        nearConfig: any;
    }
}
