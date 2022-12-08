import { ModuleContext } from "./module-context";
import { Dialogs } from "./ui/external-login-dialogs";
import { Menu } from "./ui/external-login-menu";

export class ExternalLogin extends ModuleContext {
    static Dialogs = Dialogs;
    static Menu = Menu;
}
