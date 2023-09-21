import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./tool.css";

interface ToolProps {
  style?: React.CSSProperties;
  className?: string;
  toolName: string;
  iconName: IconProp;
  handleClick?: React.MouseEventHandler;
  active?: boolean;
}

export default function Tool({
  style,
  className,
  toolName,
  iconName,
  handleClick,
  active,
}: ToolProps) {
  return (
    <button style={style} onClick={handleClick} className={className}>
      <div
        className="tool"
        style={{
          backgroundColor: active ? "rgba(0, 0, 0, 0.25)" : "transparent",
        }}
      >
        <FontAwesomeIcon
          icon={iconName}
          size="lg"
          style={{ color: "#272727" }}
        />
        <h1>{toolName}</h1>
      </div>
    </button>
  );
}
