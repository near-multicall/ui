import { Dao, Sidebar } from "../../components";

export const DaoPage = () => {
    window.PAGE = "dao";

    // TODO: remove "full" prop from Sidebar
    return (
        <>
            <Sidebar full={true} />
            <Dao />
        </>
    );
};
