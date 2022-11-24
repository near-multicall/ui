import { Config, SettingsEditor as SettingsEditorWidget } from "./config";
import { SettingsEditorUI } from "./ui/settings-editor";

export class SettingsEditor extends Config {
    static UI = SettingsEditorUI;
}

export { type SettingsEditorWidget };
