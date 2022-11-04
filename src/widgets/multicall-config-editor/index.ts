import { MulticallConfigEditorConfig, type MulticallConfigEditorWidget } from "./config";
import { MulticallConfigEditorUI } from "./ui/mc-config-editor";

class MulticallConfigEditor extends MulticallConfigEditorConfig {
    static UI = MulticallConfigEditorUI;
}

export { MulticallConfigEditor, type MulticallConfigEditorWidget };
