import { MulticallConfigEditorConfig, type MulticallConfigEditorWidget } from "./config";
import { MulticallConfigEditor as UI } from "./ui/multicall-config-editor";

class MulticallConfigEditor extends MulticallConfigEditorConfig {
    static UI = UI;
}

export { MulticallConfigEditor, type MulticallConfigEditorWidget };
