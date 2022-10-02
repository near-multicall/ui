import { WalletComponent } from "./ui/wallet";
import { useWalletSelector, WalletSelectorContextProvider } from "./ui/providers";

export class Wallet {
    static Selector = WalletComponent;
    static SelectorContextProvider = WalletSelectorContextProvider;
    static useSelector = useWalletSelector;
}
