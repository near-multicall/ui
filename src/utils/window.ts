import * as nearAPI from "near-api-js";
import type { NetworkId } from "@near-wallet-selector/core";
import { Component } from "react";
import { Persistent } from "./persistent";
import Task from "./../components/task/task";
import Layout from "./../components/layout/layout";

type CardInfo = {
    call: object;
    showArgs: boolean;
    options: object;
    errors: object;
}

type CardCopy = {
    from: string;
    to: string;
    payload?: CardInfo;
}

declare global {
    interface Window {

        // Page components
        DAO: Component

        MENU: Component
        EDITOR: Component
        EXPORT: Component

        LAYOUT: Layout
        SIDEBAR: Component

        // List of all mounted tasks
        TASKS: Array<Task>

        // Indicates what page is opened
        PAGE: "app" | "dao"

        // Temporary storage for moving and cloning cards
        TEMP: CardInfo | null
        COPY: CardCopy | null

        // Storing data, persists reloads
        STORAGE: Persistent

        // Wallet definitions
        WALLET_COMPONENT: Promise<nearAPI.WalletConnection> | Component
        NEAR_ENV: NetworkId
        nearConfig: any
    }
}