"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import QrScanner from "qr-scanner";

type ScannedCustomer = {
  id: string;
  name: string;
  totalBags: number;
  usualBags: number;
  isSuspended: boolean;
};

export default function RecordSalePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [customer, setCustomer] = useState<ScannedCustomer | null>(null);
  const [bags, setBags] = useState(1);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const stopScanner = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(() => {
    if (!videoRef.current || qrScannerRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      async (result) => {
        stopScanner();
        // QR data may be a full URL (e.g. https://host/customer/<qrId>)
        // or just the bare qrId string. Extract the last path segment.
        const raw = result.data.trim();
        let qrId: string;
        // Extract the last non-empty path segment whether the QR data is:
        //   a full URL:      https://host/customer/<qrId>
        //   a relative path: customer/<qrId>  or  /customer/<qrId>
        //   a bare ID:       <qrId>
        const segments = raw.split("/").filter(Boolean);
        qrId = segments[segments.length - 1] ?? raw;
        try {
          const res = await fetch(`/api/scan/${qrId}`);
          if (!res.ok) {
            const data = await res.json();
            setError(data.error || "Customer not found");
            return;
          }
          const data: ScannedCustomer = await res.json();
          setCustomer(data);
          setBags(data.usualBags || 1);
          setError(null);
        } catch {
          setError("Failed to look up customer");
        }
      },
      { highlightScanRegion: true }
    );

    scanner.start().catch(() => {
      setError("Could not access camera. Please allow camera permissions.");
      setScanning(false);
    });
    qrScannerRef.current = scanner;
  }, [stopScanner]);

  useEffect(() => {
    if (scanning) {
      startScanner();
    }
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, [scanning, startScanner]);

  const handleRecordSale = async () => {
    if (!customer) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          bags,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to record sale");
        return;
      }

      setSuccess(true);
      setCustomer(null);
      setBags(1);
      setTimeout(() => {
        setSuccess(false);
        setScanning(true);
      }, 1500);
    } catch {
      setError("Failed to record sale");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCustomer(null);
    setBags(1);
    setError(null);
    setSuccess(false);
    setScanning(true);
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <header className="mb-6">
        <a href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          &larr; Back to Dashboard
        </a>
        <h1 className="text-2xl font-bold">Record Sale</h1>
      </header>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6">
          Sale recorded successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          {error}
          <button
            onClick={() => {
              setError(null);
              setScanning(true);
            }}
            className="ml-4 text-red-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {scanning && !customer && (
        <div className="space-y-4">
          <p className="text-gray-600">Point camera at customer QR code</p>
          <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
            <video ref={videoRef} className="w-full h-full object-cover" />
          </div>
          <button
            onClick={() => setScanning(false)}
            className="w-full py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}

      {customer && (
        <div className="space-y-6">
          {customer.isSuspended && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
              This customer is suspended. Sales cannot be recorded.
            </div>
          )}

          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <p className="text-sm text-gray-500">Customer</p>
            <p className="text-xl font-semibold">{customer.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {customer.totalBags} bags this month
            </p>
          </div>

          {!customer.isSuspended && (
            <>
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <p className="text-sm text-gray-500 mb-3">Number of bags</p>
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => setBags(Math.max(1, bags - 1))}
                    className="w-12 h-12 text-2xl font-bold bg-gray-100 rounded-full hover:bg-gray-200 transition"
                    disabled={loading}
                  >
                    −
                  </button>
                  <span className="text-3xl font-bold w-12 text-center">{bags}</span>
                  <button
                    onClick={() => setBags(bags + 1)}
                    className="w-12 h-12 text-2xl font-bold bg-gray-100 rounded-full hover:bg-gray-200 transition"
                    disabled={loading}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRecordSale}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? "Recording..." : "Record Sale"}
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="px-4 py-3 border rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {customer.isSuspended && (
            <button
              onClick={handleReset}
              className="w-full py-3 border rounded-lg hover:bg-gray-50 transition"
            >
              Scan Another
            </button>
          )}
        </div>
      )}

      {!scanning && !customer && !error && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Camera stopped</p>
          <button
            onClick={() => setScanning(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Start Scanner
          </button>
        </div>
      )}
    </div>
  );
}