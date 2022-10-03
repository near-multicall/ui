import { DappLoginConfig } from "./config";
import { DappLoginDialogs } from "./ui/dapp-login-dialogs";
import { DappLoginMenu } from "./ui/dapp-login-menu";

export class DappLogin extends DappLoginConfig {
    static Dialogs = DappLoginDialogs;
    static Menu = DappLoginMenu;
}
