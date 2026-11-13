import { useSecurity } from "../components/SecurityGate";
export default function UnlockScreen() { return <>{useSecurity().lockScreen}</>; }
