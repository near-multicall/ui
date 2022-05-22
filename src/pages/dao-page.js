import React from 'react';
import { Dao, Sidebar } from '../components.js';

export default function DaoPage() {

    return(
        <>
            <Sidebar full={true} />
            <Dao />
        </>
    );

}