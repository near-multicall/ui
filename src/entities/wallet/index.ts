import { WalletComponent } from "./ui/wallet";
import { tryWalletSelectorContext, WalletSelectorContext, WalletSelectorContextProvider } from "./ui/providers";

export class Wallet {
    static Selector = WalletComponent;
    static SelectorContext = WalletSelectorContext;
    static SelectorContextProvider = WalletSelectorContextProvider;
    static trySelectorContext = tryWalletSelectorContext;
}
