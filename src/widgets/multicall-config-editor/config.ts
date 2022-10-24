import { HTMLProps } from "react";
import { JobSettingsEditFeature, TokensWhitelistEditFeature } from "../../features";

namespace MulticallConfigEditorWidget {
    export interface Dependencies
        extends HTMLProps<HTMLDivElement>,
            Omit<TokensWhitelistEditFeature.Dependencies, "onEdit">,
            Omit<JobSettingsEditFeature.Dependencies, "onEdit"> {}
}

class MulticallConfigEditorConfig {}

export { MulticallConfigEditorConfig, type MulticallConfigEditorWidget };
