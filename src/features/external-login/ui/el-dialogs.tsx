import { ModuleContext } from "../module-context";
import { ELModel } from "../model/el-model";
import { ELDialog } from "./el-dialog";

export const ELDialogs = () => {
    const { dialogsVisibility, closeHandlerBinding } = ELModel.useDialogsState();

    return (
        <>
            {" "}
            {Object.values(ModuleContext.methods).map((loginMethod) => (
                <ELDialog
                    key={loginMethod.type}
                    method={loginMethod.type}
                    onClose={closeHandlerBinding(loginMethod.type)}
                    open={dialogsVisibility[loginMethod.type]}
                    {...loginMethod}
                />
            ))}
        </>
    );
};
