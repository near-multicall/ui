import * as nearAPI from "near-api-js";
import { Component } from "react";
import { Persistent } from "./persistent";
import Task from "./../components/task/task";
import Layout from "./../components/layout/layout";

type CardInfo = {
    call: Object;
    showArgs: Boolean;
    options: Object;
    errors: Object;
}

type CardCopy = {
    from: String;
    to: String;
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
        WALLET: Promise<nearAPI.WalletConnection> | Component
        NEAR_ENV: string
        nearConfig: any
        near: nearAPI.Near
        walletAccount: nearAPI.WalletConnection
        account: nearAPI.ConnectedWalletAccount
        accountId: string
        contract: nearAPI.Contract

    }
}