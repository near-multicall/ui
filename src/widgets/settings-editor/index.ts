import { ModuleContext, SettingsEditor as SettingsEditorModule } from "./context";
import { SettingsEditorUI } from "./ui/settings-editor";

export class SettingsEditor extends ModuleContext {
    static UI = SettingsEditorUI;
}

export { type SettingsEditorModule };
