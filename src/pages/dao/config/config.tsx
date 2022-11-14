import { DeleteOutline } from "@mui/icons-material";
import clsx from "clsx";
import type { HTMLProps } from "react";
import { args } from "../../../shared/lib/args/args";

import { Multicall } from "../../../shared/lib/contracts/multicall";
import { toNEAR } from "../../../shared/lib/converter";
import { Tile } from "../../../shared/ui/components";

import "./config.scss";

const Link = ({ address, deleteIcon = false }: { address: string; deleteIcon?: boolean }) => (
    <span>
        {args.string().address().isValidSync(address) ? (
            <a
                href={args.string().intoUrl().cast(address)}
                target="_blank"
                rel="noopener noreferrer"
            >
                {address}
            </a>
        ) : (
            <p>{address}</p>
        )}
        {deleteIcon ? <DeleteOutline /> : null}
    </span>
);

interface DaoConfigTabComponentProps extends HTMLProps<HTMLDivElement> {
    contracts: {
        multicall: Multicall;
    };
}

const _DaoConfigTab = "DaoConfigTab";

const DaoConfigTabComponent = ({ className, contracts: { multicall } }: DaoConfigTabComponentProps) => (
    <div className={clsx(_DaoConfigTab, className)}>
        <Tile className="AdminsList">
            <h1 className="title">Admins</h1>

            <ul className="list">
                {multicall.admins.map((admin) => (
                    <li key={admin}>
                        <Link address={admin} />
                    </li>
                ))}
            </ul>
        </Tile>

        <Tile className="TokenWhitelist">
            <h1 className="title">Whitelisted Tokens</h1>

            <ul className="list">
                {multicall.tokensWhitelist.map((token) => (
                    <li key={token}>
                        <Link address={token} />
                    </li>
                ))}
            </ul>
        </Tile>

        <Tile className="JobBond">
            <h1 className="JobBond-title title">
                Job Bond
                <span>{`${multicall.jobBond !== "" ? toNEAR(multicall.jobBond) : "..."} Ⓝ`}</span>
            </h1>
        </Tile>
    </div>
);

export const DaoConfigTab = {
    connect: (props: DaoConfigTabComponentProps) => ({
        content: <DaoConfigTabComponent {...props} />,
        title: "Config",
    }),
};
