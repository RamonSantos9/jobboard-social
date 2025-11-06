// Exemplo de como usar apenas o CrowdCanvas
import { CrowdCanvas } from "@/components/ui/skiper-ui/skiper39";

const CustomCrowd = () => {
  return (
    <div className="relative h-screen w-full">
      <CrowdCanvas src="/images/peeps/all-peeps.svg" rows={15} cols={7} />
    </div>
  );
};

export default CustomCrowd;
