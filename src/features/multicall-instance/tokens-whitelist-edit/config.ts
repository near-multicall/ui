import { HTMLProps } from "react";

import { MIEntity } from "../../../entities";

namespace MITokensWhitelistEditFeature {
    export interface Dependencies extends Omit<HTMLProps<HTMLDivElement>, "onChange">, MIEntity.Dependencies {
        onEdit: (payload: Pick<MIEntity.ConfigChanges, "addTokens" | "removeTokens">) => void;
    }
}

export { type MITokensWhitelistEditFeature };
