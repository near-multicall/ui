import { ModuleContext } from "./context";
import { ELDialogs } from "./ui/el-dialogs";
import { ELMenu } from "./ui/el-menu";

export class ExternalLogin extends ModuleContext {
    static Dialogs = ELDialogs;
    static Menu = ELMenu;
}
