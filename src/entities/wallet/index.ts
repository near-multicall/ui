import { WalletSelector as WalletSelectorType } from "@near-wallet-selector/core";
import { WalletSelectorModal } from "@near-wallet-selector/modal-ui";

import { WalletContextProvider } from "./ui/wallet.providers";
import { WalletSelector } from "./ui/wallet.selector";
import { WalletService } from "./wallet.service";

export class Wallet extends WalletService {
    public static readonly Selector = WalletSelector;
    public static readonly ContextProvider = WalletContextProvider;
}

declare global {
    interface Window {
        WALLET_COMPONENT: WalletSelector;
        selector: WalletSelectorType;
        modal: WalletSelectorModal;
    }
}
