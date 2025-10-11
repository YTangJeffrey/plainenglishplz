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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const cleanUp = () => {
      setIsReadingFile(false);
      event.target.value = '';
    };

    if (!file.type.startsWith('image/')) {
      const message = 'Please choose an image file.';
      setError(message);
      onError?.(message);
      cleanUp();
      return;
    }

    setIsReadingFile(true);
    setError(null);

    try {
      const readAsDataUrl = (blob: Blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') {
              resolve(result);
            } else {
              reject(new Error('Unsupported file result'));
            }
          };
          reader.onerror = () => reject(new Error('Unable to read the selected file. Please try another image.'));
          reader.readAsDataURL(blob);
        });

      let blobToRead: Blob = file;

      if (file.type === 'image/heic' || file.type === 'image/heif') {
        try {
          const heic2any = (await import('heic2any')).default as (options: { blob: Blob; toType: string; quality?: number }) => Promise<Blob | ArrayBufferLike>;
          const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
          blobToRead = converted instanceof Blob ? converted : new Blob([converted], { type: 'image/jpeg' });
        } catch (conversionError) {
          console.error('HEIC conversion failed', conversionError);
          throw new Error('Unable to process HEIC image. Please try a different photo.');
        }
      }

      const dataUrl = await readAsDataUrl(blobToRead);
      onCapture(dataUrl);
    } catch (fileError) {
      const message = fileError instanceof Error ? fileError.message : 'Unable to read the selected file. Please try another image.';
      setError(message);
      onError?.(message);
    } finally {
      cleanUp();
    }
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
