import { ExtAuthParams } from "./ext-auth.params";
import { ExtAuthDialogs, ExtAuthMenu } from "./ext-auth.ui";

export class ExternalAuth extends ExtAuthParams {
    static Dialogs = ExtAuthDialogs;
    static Menu = ExtAuthMenu;
}
