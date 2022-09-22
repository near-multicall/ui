import clsx from "clsx";
import React from "react";

import "./index.scss";

const NAMESPACE = "Card";

export interface CardProps extends React.PropsWithChildren, React.HTMLAttributes<HTMLDivElement> {}

export const Card = ({ children, className }: CardProps) => (
    <div className={clsx(NAMESPACE, className)}>{children}</div>
);
