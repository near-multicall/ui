import { HTMLProps } from "react";
import { JobsSettingsEditFeature, TokensWhitelistEditFeature } from "../../features";

namespace MulticallConfigEditorWidget {
    export interface Dependencies
        extends HTMLProps<HTMLDivElement>,
            Omit<TokensWhitelistEditFeature.Dependencies, "onEdit">,
            Omit<JobsSettingsEditFeature.Dependencies, "onEdit"> {}
}

class MulticallConfigEditorConfig {}

export { MulticallConfigEditorConfig, type MulticallConfigEditorWidget };
