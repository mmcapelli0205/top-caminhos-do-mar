import { Input } from "@/components/ui/input";

interface PriceCellProps {
  value: number | null;
  onChange: (val: number | null) => void;
  isAuto?: boolean;
}

const PriceCell = ({ value, onChange, isAuto }: PriceCellProps) => {
  const dotColor = value != null
    ? isAuto ? "bg-blue-500" : "bg-orange-500"
    : "";

  return (
    <div className="relative">
      <Input
        type="number"
        step="0.01"
        min="0"
        className="min-w-[80px] pr-4 text-right"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : parseFloat(v));
        }}
      />
      {value != null && (
        <span className={`absolute top-1 right-1 h-2 w-2 rounded-full ${dotColor}`} />
      )}
    </div>
  );
};

export default PriceCell;
