import { CheckinScanner } from "@/components/admin/CheckinScanner";

export default function CheckinPage() {
  return (
    <div>
      <h1 className="heading-condensed text-2xl mb-2">Check-in</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Apunta la cámara al código QR de la entrada. También puedes escribir el código a mano.
      </p>
      <CheckinScanner />
    </div>
  );
}
