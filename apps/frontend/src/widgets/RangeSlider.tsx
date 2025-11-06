import { useState } from "react";

function DoubleSlider({
  min = 0,
  max = 100,
  step = 1,
  defaultValue = undefined,
  onChange,
}: {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: [number, number];
  onChange: (newValue: [number, number]) => void;
}) {
  const [range, setRange] = useState(
    defaultValue ? defaultValue : ([min, max] as [number, number])
  );

  const handleChange = (index: number, value: string) => {
    let newRange: [number, number] = [...range];
    let valueNumber = Number(value);

    // 確保左滑塊不能超過右滑塊，右滑塊不能低於左滑塊
    if (index === 0) {
      valueNumber = Math.min(valueNumber, range[1]);
    } else {
      valueNumber = Math.max(valueNumber, range[0]);
    }

    newRange[index] = valueNumber;
    setRange(newRange);
    if (onChange) onChange(newRange);
  };

  const getPercent = (value: number) => ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: white;
          border: 4px solid var(--color-primary);
          border-radius: 50%;
          cursor: pointer;
          pointer-events: auto;
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: white;
          border: 4px solid var(--color-primary);
          border-radius: 50%;
          cursor: pointer;
          pointer-events: auto;
        }
      `}</style>

      <div className="relative w-full h-2 bg-gray-300 rounded">
        {/* 選擇範圍的顯示條 */}
        <div
          className="absolute h-2 bg-primary rounded"
          style={{
            left: `${getPercent(range[0])}%`,
            width: `${getPercent(range[1]) - getPercent(range[0])}%`,
          }}
        />

        {/* 左滑塊 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={range[0]}
          onChange={(e) => handleChange(0, e.target.value)}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: range[0] === range[1] ? 5 : 3 }}
        />

        {/* 右滑塊 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={range[1]}
          onChange={(e) => handleChange(1, e.target.value)}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}

export default DoubleSlider;
