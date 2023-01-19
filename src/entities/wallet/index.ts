import { WalletSelector as WalletSelectorType } from "@near-wallet-selector/core";
import { WalletSelectorModal } from "@near-wallet-selector/modal-ui";

import { WalletContextProvider } from "./ui/wallet.providers";
import { WalletSelector } from "./ui/wallet.selector";
import { WalletContext, tryWalletContext } from "./wallet.service";

export class Wallet {
    static Selector = WalletSelector;
    static Context = WalletContext;
    static ContextProvider = WalletContextProvider;
    static tryContext = tryWalletContext;
}

declare global {
    interface Window {
        WALLET_COMPONENT: WalletSelector;
        selector: WalletSelectorType;
        modal: WalletSelectorModal;
    }
}
