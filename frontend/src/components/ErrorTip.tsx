export default function ErrorTip({ message }: { message: string }) {
  return (
    <div
      className="bg-rose-700 rounded px-2"
      style={{ position: "absolute", left: "0.666rem", top: "1.33rem" }}
    >
      {message}
    </div>
  );
}
