import qrcode from "qrcode-generator";
export function encodeQrMatrix(value: string): boolean[][] {
  if (!value || value.length > 1024 || /[^\x20-\x7e]/.test(value)) throw new Error("The QR request could not be encoded.");
  const qr = qrcode(0, "M");
  qr.addData(value, "Byte");
  qr.make();
  return Array.from({ length: qr.getModuleCount() }, (_, row) => Array.from({ length: qr.getModuleCount() }, (_, column) => qr.isDark(row, column)));
}
