import { WalletComponent } from "./ui";
import { useSelector, WalletSelectorContextProvider } from "./ui/providers";

export const Wallet = {
    Selector: WalletComponent,
    SelectorContextProvider: WalletSelectorContextProvider,
    useSelector,
};
