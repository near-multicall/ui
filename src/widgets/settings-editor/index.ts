import { ModuleContext, SettingsEditor as SettingsEditorWidget } from "./context";
import { SettingsEditorUI } from "./ui/settings-editor";

export class SettingsEditor extends ModuleContext {
    static UI = SettingsEditorUI;
}

export { type SettingsEditorWidget };
