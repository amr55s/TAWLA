'use client';

import * as React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BackButton, PageHeader } from '@/components/ui';

interface ScannedOrder {
  restaurantSlug: string;
  tableNumber: string;
  timestamp: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    specialRequests?: string;
  }>;
  total: number;
}

export default function ScanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = React.use(params);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const handleScan = useCallback((data: string) => {
    try {
      const order: ScannedOrder = JSON.parse(data);
      
      if (order.restaurantSlug && order.tableNumber && order.items) {
        // Store scanned order in sessionStorage
        sessionStorage.setItem('scannedOrder', JSON.stringify(order));
        router.push(`/${slug}/waiter/confirm?table=${order.tableNumber}`);
      }
    } catch (e) {
      console.error('Invalid QR data:', e);
      setError('Invalid QR code. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  }, [router, slug]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          setIsScanning(true);
        }
      } catch (err) {
        console.error('Camera access denied:', err);
        setHasPermission(false);
        setError('Camera access is required to scan QR codes.');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // For demo purposes, add a manual scan button
  const handleDemoScan = () => {
    const demoOrder: ScannedOrder = {
      restaurantSlug: slug,
      tableNumber: '14',
      timestamp: Date.now(),
      items: [
        { id: '1', name: 'Truffle Risotto', quantity: 1, price: 42 },
        { id: '2', name: 'Wagyu Beef Carpaccio', quantity: 2, price: 38 },
        { id: '3', name: 'Château Margaux 2015', quantity: 1, price: 850 },
      ],
      total: 1064.80,
    };
    handleScan(JSON.stringify(demoOrder));
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <PageHeader
          left={<BackButton variant="white" onClick={() => router.back()} />}
          center={
            <span className="text-sm font-semibold tracking-wider uppercase text-white/80">
              Scan QR Code
            </span>
          }
          transparent
        />
      </div>

      {/* Camera View */}
      <div className="relative h-screen">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Darkened corners */}
          <div className="absolute inset-0 bg-black/50" />
          
          {/* Scan area */}
          <div className="relative w-64 h-64">
            {/* Clear center */}
            <div className="absolute inset-0 bg-transparent" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
            
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />

            {/* Scanning line animation */}
            {isScanning && (
              <motion.div
                initial={{ top: 0 }}
                animate={{ top: '100%' }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute left-0 right-0 h-0.5 bg-primary shadow-lg"
                style={{ boxShadow: '0 0 10px 2px rgba(67, 99, 78, 0.5)' }}
              />
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-32 left-0 right-0 text-center px-6">
          <p className="text-white text-lg font-medium mb-2">
            Position the QR code within the frame
          </p>
          <p className="text-white/60 text-sm">
            The scan will happen automatically
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-48 left-6 right-6"
          >
            <div className="bg-red-500 text-white px-4 py-3 rounded-2xl text-center text-sm font-medium">
              {error}
            </div>
          </motion.div>
        )}

        {/* Permission Denied */}
        {hasPermission === false && (
          <div className="absolute inset-0 bg-black flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                  <line x1="12" y1="2" x2="12" y2="12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Camera Access Required</h2>
              <p className="text-white/60 mb-6">
                Please allow camera access to scan QR codes
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-white text-black rounded-2xl font-semibold"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Demo Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 safe-bottom">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleDemoScan}
          className="w-full h-14 bg-primary rounded-3xl flex items-center justify-center gap-2"
        >
          <span className="text-base font-bold text-white">Demo: Simulate Scan</span>
        </motion.button>
      </div>
    </div>
  );
}
