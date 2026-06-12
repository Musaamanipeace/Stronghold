import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, RefreshCw, X, AlertTriangle, Sparkles } from 'lucide-react';

interface QRScannerProps {
  onScan: (text: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Enumerate cameras on startup
  useEffect(() => {
    async function getCameras() {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = list.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        
        // Prefer rear camera or fallback to first one available
        const backCamera = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        if (backCamera) {
          setSelectedCameraId(backCamera.deviceId);
        } else if (videoDevices.length > 0) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      } catch (err: any) {
        console.warn('Could not enumerate media devices:', err);
      }
    }
    getCameras();
  }, []);

  // Request camera and start stream when selected camera ID changes
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMessage('');

    async function startCamera() {
      // Clean up previous stream and loop
      stopCamera();

      const constraints: MediaStreamConstraints = {
        video: selectedCameraId 
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode: 'environment' }
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Set standard video attributes to prevent iOS Safari from hijacking the feed fullscreen
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }
        
        setHasPermission(true);
        setIsLoading(false);
        
        // Start scanning cycle
        tickScan();
      } catch (err: any) {
        console.error('Camera streaming request failed:', err);
        if (active) {
          setHasPermission(false);
          setIsLoading(false);
          setErrorMessage(
            err.name === 'NotAllowedError' 
              ? 'Camera permission denied. Please allow camera access in your browser settings.' 
              : 'Failed to access camera. Ensure it is connected and not in use by another app.'
          );
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [selectedCameraId]);

  // Stop camera tracks and cancel scanning animation frames
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Continuous frame analysis
  const tickScan = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        // Match offscreen canvas dimensions with video feed resolution
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame onto canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Fetch image pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Analyze image bytes for QR codes
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        
        if (code) {
          // Success! Emit result and exit
          onScan(code.data);
          stopCamera();
          return;
        }
      }
    }
    
    // Resume cycle
    animationFrameRef.current = requestAnimationFrame(tickScan);
  };

  // Handle manual source cycling
  const cycleCamera = () => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex(d => d.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setSelectedCameraId(devices[nextIndex].deviceId);
  };

  return (
    <div className="bg-brand-bg/85 border border-brand-border/80 rounded-xl overflow-hidden p-4 relative" id="camera-qr-scanner-widget">
      
      {/* Title & Actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 text-brand-primary text-xs font-mono font-bold tracking-wider uppercase">
          <Camera className="w-4 h-4 fill-brand-primary/15 animate-pulse" />
          <span>QR Scanner Active</span>
        </div>
        <div className="flex items-center space-x-1.5">
          {devices.length > 1 && (
            <button
              onClick={cycleCamera}
              className="p-1 px-2.5 bg-brand-card hover:bg-brand-border border border-brand-border rounded-lg text-[10px] font-mono text-brand-text-secondary hover:text-brand-text-primary transition-all flex items-center gap-1 cursor-pointer"
              title="Switch camera input source"
            >
              <RefreshCw className="w-3 h-3" />
              Flip Cam
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 bg-brand-card hover:bg-red-500/10 border border-brand-border rounded-lg text-brand-text-secondary hover:text-red-400 transition-colors"
            title="Deactivate QR scanner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Viewfinder Frame */}
      <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-brand-border/60 shadow-inner flex items-center justify-center">
        
        {/* Hidden offscreen canvas for computational pixel processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live camera stream */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          id="qr-video-feed"
        />

        {/* Loader Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-brand-card/95 flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 text-brand-primary animate-spin" />
            <span className="text-[10px] font-mono text-brand-text-secondary uppercase">Warming up camera...</span>
          </div>
        )}

        {/* Error / Permission Denied overlay */}
        {hasPermission === false && (
          <div className="absolute inset-0 bg-brand-card/95 p-4 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-2 bg-brand-warning/10 border border-brand-warning/20 text-brand-warning rounded-lg">
              <CameraOff className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-brand-text-primary block">Camera Feed Blocked</span>
              <p className="text-[10px] font-mono text-brand-text-secondary leading-relaxed max-w-xs mx-auto">
                {errorMessage || 'Sovereign device credentials require permission. Access was dismissed.'}
              </p>
            </div>
            <button
              onClick={() => setSelectedCameraId(prev => prev || 'retry')}
              className="px-3 py-1.5 bg-brand-primary text-brand-bg rounded-lg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Scanning HUD Crosshair & Laser effect overlay (Only visible when loaded & active) */}
        {!isLoading && hasPermission && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            
            {/* Darkened visual periphery to focus scanning center */}
            <div className="absolute inset-0 border-[32px] border-black/40" />

            {/* Scanning square targeting box */}
            <div className="w-36 h-36 border-2 border-dashed border-brand-primary/50 relative flex items-center justify-center transition-all animate-pulse">
              
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brand-primary -mt-[2px] -ml-[2px]" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brand-primary -mt-[2px] -mr-[2px]" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brand-primary -mb-[2px] -ml-[2px]" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brand-primary -mb-[2px] -mr-[2px]" />

              {/* Pulsing red laser tracker bar across scanning square */}
              <div className="absolute left-0 right-0 h-[2px] bg-brand-primary/80 animate-[scanLaser_2s_infinite_linear] shadow-[0_0_8px_rgba(235,94,40,0.8)]" />
            </div>

            {/* Overlay instruction */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 px-2.5 py-1 rounded-full border border-brand-border/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-primary" />
              <span className="text-[9px] font-mono text-brand-text-primary tracking-wider uppercase">Align QR Code Inside Box</span>
            </div>
          </div>
        )}

      </div>

      {/* Styled inline animation block for the laser speed scanner line */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
