'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export const CameraCapture = ({ onCapture, disabled = false, onError }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);

  useEffect(() => {
    if (!isStreaming) {
      return;
    }

    let stream: MediaStream | null = null;
    let videoElement: HTMLVideoElement | null = null;
    let removeLoadedMetadata: (() => void) | null = null;
    let isCancelled = false;

    const setupCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        const message = 'Camera access is not supported in this browser.';
        setError(message);
        onError?.(message);
        setIsStreaming(false);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;
        videoElement = videoRef.current;

        if (!videoElement) {
          return;
        }

        const handleLoadedMetadata = async () => {
          try {
            await videoElement?.play();
            if (!isCancelled) {
              setIsReady(true);
            }
          } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
              console.info('Camera play interrupted', err);
            } else {
              console.error('Error starting camera playback', err);
              const message = 'We could not start the camera stream.';
              setError(message);
              onError?.(message);
            }
          }
        };

        videoElement.srcObject = stream;
        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
        removeLoadedMetadata = () => {
          videoElement?.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };

        if (videoElement.readyState >= 1) {
          handleLoadedMetadata();
        }
      } catch (err) {
        console.error('Camera error', err);
        const message = 'We could not access the camera. Please allow permissions or use a different device.';
        setError(message);
        onError?.(message);
        setIsStreaming(false);
      }
    };

    setupCamera();

    return () => {
      isCancelled = true;
      removeLoadedMetadata?.();
      if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      } else if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isStreaming, onError]);

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      const message = 'Camera is still warming up. Try again in a moment.';
      setError(message);
      onError?.(message);
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    if (!context) {
      const message = 'Unable to capture from camera.';
      setError(message);
      onError?.(message);
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCapture(dataUrl);
    setIsStreaming(false);
    setIsReady(false);
  };

  const handleStart = () => {
    setError(null);
    setIsReady(false);
    setIsStreaming(true);
  };

  const handleUploadClick = () => {
    if (disabled || isReadingFile) {
      return;
    }

    if (isStreaming) {
      setIsStreaming(false);
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      const message = 'Please choose an image file.';
      setError(message);
      onError?.(message);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    setIsReadingFile(true);
    setError(null);

    reader.onload = () => {
      setIsReadingFile(false);
      event.target.value = '';
      const result = reader.result;
      if (typeof result === 'string') {
        onCapture(result);
      }
    };

    reader.onerror = () => {
      console.error('Unable to read the selected file');
      setIsReadingFile(false);
      event.target.value = '';
      const message = 'Unable to read the selected file. Please try another image.';
      setError(message);
      onError?.(message);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="camera-capture">
      <div className="camera-frame">
        {!isStreaming && !error && <p className="camera-placeholder">Tap “Scan Label” to start your camera.</p>}
        {!isStreaming && error && <p className="camera-error">{error}</p>}
        {isStreaming && !isReady && !error && <p className="camera-status">Getting camera ready…</p>}
        {isStreaming && error && <p className="camera-error">{error}</p>}
        <video ref={videoRef} playsInline muted className="camera-video" />
        <canvas ref={canvasRef} className="camera-canvas" hidden aria-hidden="true" />
      </div>

      <div className="capture-actions">
        {!isStreaming ? (
          <button
            className="primary-button"
            onClick={handleStart}
            disabled={disabled || isReadingFile}
            type="button"
          >
            Scan Label
          </button>
        ) : (
          <button
            className="primary-button"
            onClick={handleCapture}
            disabled={!isReady || disabled || Boolean(error) || isReadingFile}
            type="button"
          >
            {isReady ? 'Capture Label' : 'Preparing camera…'}
          </button>
        )}

        <button
          className="ghost-button"
          type="button"
          onClick={handleUploadClick}
          disabled={disabled || isReadingFile}
        >
          {isReadingFile ? 'Uploading…' : 'Upload Photo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};
