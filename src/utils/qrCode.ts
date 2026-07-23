import QRCode from 'qrcode'

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { width: 300, margin: 2 })
}
