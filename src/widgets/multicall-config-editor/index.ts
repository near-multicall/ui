import { MIEntityConfigEditorConfig, type MIEntityConfigEditorWidget } from "./config";
import { MIEntityConfigEditorUI } from "./ui/multicall-config-editor";

class MIEntityConfigEditor extends MIEntityConfigEditorConfig {
    static UI = MIEntityConfigEditorUI;
}

export { MIEntityConfigEditor, type MIEntityConfigEditorWidget };
