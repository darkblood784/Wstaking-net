import V10 from "./V10";
import V11 from "./V11";
import V12 from "./V12";
import V13 from "./V13";
import V14 from "./V14";
import V15 from "./V15";

interface DescriptionProps {
  version: string;
}

const Description: React.FC<DescriptionProps> = ({ version }) => {
  switch (version) {
    case "1.0":
      return <V10 />;
    case "1.1":
      return <V11 />;
    case "1.2":
      return <V12 />;
    case "1.3":
      return <V13 />;
    case "1.4":
      return <V14 />;
    case "1.5":
      return <V15 />;
    default:
      return <V15 />;
  }
};

export default Description;
