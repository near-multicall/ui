import clsx from "clsx";
import "./info-field.scss";

type InfoFieldProps = React.PropsWithChildren & {
    roundtop?: boolean;
    roundbottom?: boolean;
};

export const InfoField = ({ roundbottom, roundtop, ...props }: InfoFieldProps) => {
    return (
        <div
            className={clsx("InfoField", {
                roundtop,
                roundbottom,
            })}
        >
            <div className="InfoField-content">{props.children}</div>
        </div>
    );
};
