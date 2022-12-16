import { ModuleContext } from "./module-context";
import { ELDialogs } from "./ui/external-login.dialogs";
import { ELMenu } from "./ui/external-login.menu";

export class ExternalLogin extends ModuleContext {
    static Dialogs = ELDialogs;
    static Menu = ELMenu;
}
