import * as nearAPI from "near-api-js";
import type { NetworkId } from "@near-wallet-selector/core";
import { Component } from "react";

import { Task, Layout } from "../../widgets";

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
        DAO_COMPONENT: Component;

        MENU: Component;
        EDITOR: Component;
        EXPORT: Component;

        LAYOUT: Layout;
        SIDEBAR: Component;

        // List of all mounted tasks
        TASKS: Array<Task>;

        // Indicates what page is opened
        PAGE: "app" | "dao";

        // Temporary storage for moving and cloning cards
        TEMP: CardInfo | null;
        COPY: CardCopy | null;

        // Wallet definitions
        WALLET_COMPONENT: Promise<nearAPI.WalletConnection> | Component;
        NEAR_ENV: NetworkId;
        nearConfig: any;
    }
}
