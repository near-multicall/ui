import { createContext } from "react";

import { WalletModel } from "./wallet.model";

export const WalletContext = createContext<WalletModel | null>(null);

export const tryWalletContext = () => {
    if (!WalletContext) {
        throw new Error("tryWalletContext must be used within a WalletContextProvider");
    }

    return WalletContext;
};
