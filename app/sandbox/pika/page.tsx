import PikaShell from "./PikaShell";
import "./pika.css";

export const metadata = { title: "Pika shell (mock) — polyglot" };

// Public on purpose: the point is that it can be opened and clicked without an
// account, a token, or a running Pika.
export default function Page() {
  return <PikaShell />;
}
