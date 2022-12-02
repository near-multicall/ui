import { ModuleContext, SettingsEditor as SettingsEditorModule } from "./module-context";
import { SettingsEditorUI } from "./ui/settings-editor";

export class SettingsEditor extends ModuleContext {
    static UI = SettingsEditorUI;
}

export { type SettingsEditorModule };
