import { DaoConfigEditorConfig, type DaoConfigEditorWidget } from "./config";
import { DaoConfigEditorUI } from "./ui/dao-config-editor";

class DaoConfigEditor extends DaoConfigEditorConfig {
    static UI = DaoConfigEditorUI;
}

export { DaoConfigEditor, type DaoConfigEditorWidget };
