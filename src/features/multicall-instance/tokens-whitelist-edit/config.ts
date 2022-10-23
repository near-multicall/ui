import { HTMLProps } from "react";

import { MIEntity } from "../../../entities";

namespace MITokensWhitelistEditFeature {
    export interface Dependencies extends Omit<HTMLProps<HTMLDivElement>, "onChange">, MIEntity.Dependencies {
        onChange: (payload: {
            toAdd: MIEntity.Token["address"][] | [];
            toRemove: MIEntity.Token["address"][] | [];
        }) => void;
    }
}

export { type MITokensWhitelistEditFeature };
