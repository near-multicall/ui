import React from 'react';
import { Dao, Sidebar } from '../components.js';

export default function DaoPage() {

    window.PAGE = "dao";

    return(
        <>
            <Sidebar full={true} />
            <Dao />
        </>
    );

}