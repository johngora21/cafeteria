"use client";
import { useEffect, useRef } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";

export function QRScanner({ onResult }: { onResult: (result: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const codeReader = new BrowserQRCodeReader();
    let stop = false;

    if (videoRef.current) {
      codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err) => {
          if (result && !stop) {
            stop = true;
            onResult(result.getText());
            codeReader.reset();
          }
        }
      );
    }
    return () => {
      stop = true;
      codeReader.reset();
    };
  }, [onResult]);

  return <video ref={videoRef} style={{ width: "100%" }} />;
} 