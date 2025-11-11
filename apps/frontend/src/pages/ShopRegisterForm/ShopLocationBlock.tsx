// import type { Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";

const ShopLocationBlock = ({}: {}) => {
  return (
    <QuestionBlock title="地點">
      <input type="text" className="input w-full" placeholder="輸入地址" />

      <div className="flex space-x-1 p-1 bg-base-300 rounded-xl">
        <button className="btn flex-1 bg-base-100">從地圖選擇</button>
        <button className="btn flex-1 opacity-30">使用當前位置</button>
      </div>

      <p className="text-sm opacity-50">由地圖中選擇一個對應的地點</p>

      <div className="w-full h-80 bg-base-300 rounded-field"></div>
    </QuestionBlock>
  );
};

export default ShopLocationBlock;
