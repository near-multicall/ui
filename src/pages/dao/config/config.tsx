import { AddOutlined, DeleteOutline } from "@mui/icons-material";
import clsx from "clsx";
import type { HTMLProps } from "react";

import { ArgsAccount } from "../../../shared/lib/args";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { toNEAR } from "../../../shared/lib/converter";
import { Facet } from "../../../shared/ui/components";

import "./config.scss";

const Link = ({ address, deleteIcon = false }: { address: string; deleteIcon?: boolean }) => {
    const addr = new ArgsAccount(address);

    return (
        <span>
            <a
                href={addr.toUrl()}
                target="_blank"
                rel="noopener noreferrer"
            >
                {addr.value}
            </a>
            {deleteIcon ? <DeleteOutline /> : null}
        </span>
    );
};

interface DaoConfigTabComponentProps extends HTMLProps<HTMLDivElement> {
    contracts: {
        multicall: Multicall;
    };
}

const _DaoConfigTab = "DaoConfigTab";

const DaoConfigTabComponent = ({ className, contracts: { multicall } }: DaoConfigTabComponentProps) => (
    <div className={clsx(_DaoConfigTab, className)}>
        <Facet className="AdminsList">
            <AddOutlined />
            <h1 className="title">Admins</h1>

            <ul className="list">
                {multicall.admins.map((admin) => (
                    <li key={admin}>
                        <Link address={admin} />
                    </li>
                ))}
            </ul>
        </Facet>

        <Facet className="TokenWhitelist">
            <h1 className="title">Whitelisted Tokens</h1>

            <ul className="list">
                {multicall.tokensWhitelist.map((token) => (
                    <li key={token}>
                        <Link address={token} />
                    </li>
                ))}
            </ul>
        </Facet>

        <Facet className="JobBond">
            <h1 className="JobBond-title title">
                Job Bond
                <span>{`${multicall.jobBond !== "" ? toNEAR(multicall.jobBond) : "..."} Ⓝ`}</span>
            </h1>
        </Facet>
    </div>
);

export const DaoConfigTab = {
    connect: (props: DaoConfigTabComponentProps) => ({
        content: <DaoConfigTabComponent {...props} />,
        title: "Config",
    }),
};
