import { chromeLight } from "react-inspector";

export class ModuleContext {
    static readonly theme = {
        ...chromeLight,
        BASE_BACKGROUND_COLOR: "transparent",
    };
}
