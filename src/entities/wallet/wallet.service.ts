import { createContext } from "react";

import { WalletModel } from "./wallet.model";

export class WalletService {
    public static readonly Context = createContext<WalletModel | null>(null);

    public static readonly tryContext = () => {
        if (!WalletService.Context) {
            throw new Error("tryWalletContext must be used within a WalletContextProvider");
        }

        return WalletService.Context;
    };
}