import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function AssetQrScanner({ onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'fixflow-asset-qr-reader',
      { fps: 8, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
      false
    );
    scanner.render(decodedText => onScan(decodedText), () => {});
    return () => {
      scanner.clear().catch(error => console.error('Unable to stop QR scanner:', error));
    };
  }, [onScan]);

  return <div id="fixflow-asset-qr-reader" />;
}
