import { Config } from "./config";
import { ELDialogs } from "./ui/el-dialogs";
import { ELMenu } from "./ui/el-menu";

export class ExternalLogin extends Config {
    static Dialogs = ELDialogs;
    static Menu = ELMenu;
}
