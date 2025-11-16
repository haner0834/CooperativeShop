import QuestionBlock from "./QuestionBlock";

const FormHeader = () => {
  return (
    <QuestionBlock title="特約商家註冊" status={null}>
      <div className="text-neutral/50 text-sm">
        在以下問題中，右上角有{" "}
        <div
          aria-label="optional question"
          className="status status-info"
        ></div>{" "}
        代表的是非必填問題，而{" "}
        <div
          aria-label="required question"
          className="status status-error"
        ></div>{" "}
        為必填問題。所有操作都將自動保存。
      </div>
    </QuestionBlock>
  );
};

export default FormHeader;
