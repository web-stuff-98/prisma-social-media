export default function Toggler({
  value,
  toggleValue = () => {},
  label = "Label",
  ...props
}: {
  value: boolean;
  toggleValue: () => void;
  label?: string;
  props?: any;
}) {
  return (
    <button
      {...props}
      onClick={() => toggleValue()}
      className="px-1 text-sm text-normal flex flex-col w-8 items-center h-10 justify-center bg-transparent"
    >
      {label}
      <span className="w-full dark:bg-gray-600 bg-stone-900 relative h-1 rounded-full">
        <span
          style={{ position: "absolute", left: value ? "calc(100% - 0.5rem)" : "-0.25rem", top: "-0.0675rem", transition:"left 100ms ease" }}
          className="rounded-sm bg-white dark:bg-gray-300 shadow-md h-1.5 w-3 border border-black dark:border-white"
        />
      </span>
    </button>
  );
}
