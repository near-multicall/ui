import clsx from "clsx";
import "./info-field.scss";

const _InfoField = "InfoField";

type InfoFieldProps = React.PropsWithChildren & {
    roundtop?: boolean;
    roundbottom?: boolean;
};

export const InfoField = ({ roundbottom, roundtop, ...props }: InfoFieldProps) => {
    return (
        <div
            className={clsx(_InfoField, {
                roundtop: roundtop,
                roundbottom: roundbottom,
            })}
        >
            <div className={clsx(`${_InfoField}-content`)}>{props.children}</div>
        </div>
    );
};
