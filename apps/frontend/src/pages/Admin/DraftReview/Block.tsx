const Block = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`bg-base-100 rounded-box w-full p-4 flex flex-col gap-2 ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
};

export default Block;
