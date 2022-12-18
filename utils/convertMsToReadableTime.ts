export default function convertMsToHM(milliseconds: number) {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  seconds = seconds % 60;
  minutes = minutes % 60;
  hours = hours % 24;
  return `${hours ? `${hours} hours${minutes || seconds ? ", " : ""}` : ""}${
    minutes ? `${minutes} minutes${seconds ? ", " : ""}` : ""
  }${seconds ? `${seconds} seconds` : ""}`;
}
