import { Config, Widget } from "./config";
import { SettingsEditor as UI } from "./ui/settings-editor";

class SettingsEditor extends Config {
    static UI = UI;
}

export { SettingsEditor, type Widget as SettingsEditorWidget };
