import { Layout, Sidebar } from "../../widgets";

export const AppPage = () => {
    window.PAGE = "app";

    return (
        <>
            <Sidebar />
            <Layout />
        </>
    );
};
