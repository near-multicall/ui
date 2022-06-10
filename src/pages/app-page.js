import React from 'react';
import { Layout, Sidebar } from '../components.js';

export default function AppPage() {

    window.PAGE = "app";

    return(
        <>
            <Sidebar/>
            <Layout/>
        </>
    );

}