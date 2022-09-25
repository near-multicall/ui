import { Layout, Sidebar } from "../../components";

export const AppPage = () => {
    window.PAGE = "app";

    return (
        <>
            <Sidebar />
            <Layout />
        </>
    );
};
