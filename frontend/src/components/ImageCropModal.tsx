import { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropModalProps {
  file: File;
  aspect?: number; // e.g. 16/9, 1, 4/3. Omit for free crop.
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
}

/**
 * Produces a cropped Blob from an image element + pixel crop,
 * preserving the image's native resolution (not the displayed size).
 */
async function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  mimeType: string,
  quality = 0.92
): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(crop.width * scaleX);
  canvas.height = Math.floor(crop.height * scaleY);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Canvas is empty'));
        else resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

export function ImageCropModal({ file, aspect, onConfirm, onCancel }: ImageCropModalProps) {
  const [imgSrc] = useState<string>(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState<Crop | undefined>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>();
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Default to a sensible centered crop covering ~90% of the image
    const initialCrop = aspect
      ? centerCrop(
          makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
          width,
          height
        )
      : centerCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90 }, width, height);
    setCrop(initialCrop);
  }, [aspect]);

  const handleConfirm = useCallback(async () => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      // Fall back to the original file if somehow nothing was cropped
      onConfirm(file);
      return;
    }
    setProcessing(true);
    try {
      // Preserve original mime unless it's a GIF (canvas flattens gifs)
      const mime = file.type === 'image/gif' ? 'image/png' : (file.type || 'image/jpeg');
      const blob = await getCroppedBlob(imgRef.current, completedCrop, mime);
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
      const croppedFile = new File([blob], `${baseName}-cropped.${ext}`, { type: mime });
      onConfirm(croppedFile);
    } catch (err) {
      console.error('Crop processing failed:', err);
      alert('Could not process the crop. The original image will be used.');
      onConfirm(file);
    } finally {
      setProcessing(false);
      URL.revokeObjectURL(imgSrc);
    }
  }, [completedCrop, file, imgSrc, onConfirm]);

  const handleCancel = useCallback(() => {
    URL.revokeObjectURL(imgSrc);
    onCancel();
  }, [imgSrc, onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop image"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={handleCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#151515',
          border: '1px solid #333',
          borderRadius: 4,
          maxWidth: '900px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #2A2A2A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
            }}
          >
            Crop Image
          </h3>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: '#999',
            }}
          >
            Drag to move, corners to resize
          </span>
        </div>

        {/* Crop area */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            padding: '20px',
            background: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            keepSelection
          >
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img
              ref={imgRef}
              src={imgSrc}
              onLoad={onImageLoad}
              style={{ maxHeight: '65vh', maxWidth: '100%', display: 'block' }}
            />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #2A2A2A',
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={handleCancel}
            disabled={processing}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: '#CCCCCC',
              border: '1px solid #444',
              borderRadius: 2,
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: processing ? 'not-allowed' : 'pointer',
              opacity: processing ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || !completedCrop}
            style={{
              padding: '10px 24px',
              background: '#E88A1A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 2,
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: processing || !completedCrop ? 'not-allowed' : 'pointer',
              opacity: processing || !completedCrop ? 0.5 : 1,
            }}
          >
            {processing ? 'Processing…' : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  );
}
