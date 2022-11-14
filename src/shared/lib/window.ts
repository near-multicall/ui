import * as nearAPI from "near-api-js";
import type { NetworkId } from "@near-wallet-selector/core";
import { Component } from "react";

import { Task, Layout, Sidebar, Menu, Editor } from "../../widgets";
import { WalletComponent } from "../../entities/wallet/ui/wallet";

type CardInfo = {
    formData: object;
    showArgs: boolean;
    isEdited: boolean;
    options: object;
};

type CardCopy = {
    from: string;
    to: string;
    payload?: Omit<CardInfo, "isEdited">;
};

declare global {
    interface Window {
        // Page components
        DAO_COMPONENT: Component;

        MENU: Menu;
        EDITOR: Editor;
        EXPORT: Component;

        LAYOUT: Layout;
        SIDEBAR: Sidebar;

        // List of all mounted tasks
        TASKS: Array<Task>;

        // Temporary storage for moving and cloning cards
        TEMP: CardInfo | null;
        COPY: CardCopy | null;

        // Wallet definitions
        WALLET_COMPONENT: WalletComponent;
        NEAR_ENV: NetworkId;
        nearConfig: any;
    }
}
