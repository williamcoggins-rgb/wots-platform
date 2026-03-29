import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import type { GalleryImage } from '../types';

const CLOUDINARY_CLOUD = 'dcpeomifz';
const CLOUDINARY_PRESET = 'wots_unsigned';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

const CATEGORIES: GalleryImage['category'][] = ['hero', 'characters', 'environments', 'covers', 'misc'];

const adminStyles = `
.admin-drop-zone {
  border: 2px dashed rgba(255,215,0,0.3);
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}
.admin-drop-zone:hover,
.admin-drop-zone.drag-over {
  border-color: var(--color-gold);
  background: rgba(255,215,0,0.05);
  box-shadow: 0 0 30px rgba(255,215,0,0.1);
}
.admin-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(20,20,40,0.6);
  border: 1px solid rgba(184,131,74,0.2);
  border-radius: 8px;
  color: var(--color-sand-light);
  font-family: var(--font-body);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}
.admin-input:focus {
  border-color: var(--color-gold);
}
.admin-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(20,20,40,0.8);
  border: 1px solid rgba(184,131,74,0.2);
  border-radius: 8px;
  color: var(--color-sand-light);
  font-family: var(--font-body);
  font-size: 0.95rem;
  outline: none;
  cursor: pointer;
  box-sizing: border-box;
}
.admin-select:focus {
  border-color: var(--color-gold);
}
.admin-btn {
  padding: 0.75rem 2rem;
  background: var(--color-gold);
  color: var(--color-obsidian);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.admin-btn:hover {
  background: var(--color-gold-dim);
  transform: translateY(-2px);
}
.admin-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
.admin-btn-danger {
  padding: 0.4rem 0.8rem;
  background: transparent;
  color: var(--color-scarlet);
  border: 1px solid rgba(139,26,26,0.4);
  border-radius: 6px;
  font-family: var(--font-display);
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
}
.admin-btn-danger:hover {
  background: rgba(139,26,26,0.15);
  border-color: var(--color-scarlet);
}
.admin-image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}
.admin-image-card {
  background: rgba(20,20,40,0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,215,0,0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}
.admin-image-card:hover {
  border-color: rgba(255,215,0,0.3);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.4);
}
.admin-progress-bar {
  height: 4px;
  background: rgba(255,215,0,0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 1rem;
}
.admin-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-gold-dim), var(--color-gold));
  border-radius: 2px;
  transition: width 0.3s ease;
}
.category-badge {
  display: inline-block;
  font-family: var(--font-display);
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-gold);
  background: rgba(255,215,0,0.1);
  border: 1px solid rgba(255,215,0,0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}
@media (max-width: 640px) {
  .admin-image-grid {
    grid-template-columns: 1fr;
  }
}
`;

export function Admin() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GalleryImage['category']>('misc');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    try {
      const col = collection(db, 'gallery_images');
      const q = query(col, orderBy('uploadedAt', 'desc'));
      const snapshot = await getDocs(q);
      const imgs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as GalleryImage[];
      setImages(imgs);
    } catch (err) {
      console.error('Failed to fetch images:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleFileSelect = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (jpg, png, webp, gif).');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (!title) {
      setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [title]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', CLOUDINARY_PRESET);

      setUploadProgress(30);

      const res = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Cloudinary upload failed');

      const data = await res.json();
      const secureUrl: string = data.secure_url;

      setUploadProgress(70);

      // Save to Firestore
      await addDoc(collection(db, 'gallery_images'), {
        url: secureUrl,
        title: title.trim(),
        category,
        uploadedAt: Date.now(),
      });

      setUploadProgress(100);

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setTitle('');
      setCategory('misc');

      // Refresh list
      await fetchImages();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Delete this image from the gallery?')) return;
    try {
      await deleteDoc(doc(db, 'gallery_images', imageId));
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete image.');
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <style>{adminStyles}</style>
      <div
        style={{
          minHeight: '100vh',
          padding: '6rem 1.5rem 4rem',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              color: 'var(--color-gold)',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem',
            }}
          >
            Art Gallery Admin
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              color: 'var(--color-sand-dark)',
            }}
          >
            Upload and manage gallery artwork
          </p>
        </div>

        {/* Upload Section */}
        <div
          style={{
            background: 'rgba(20,20,40,0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,215,0,0.1)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '3rem',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              color: 'var(--color-gold)',
              letterSpacing: '0.08em',
              marginBottom: '1.5rem',
            }}
          >
            Upload New Image
          </h2>

          {/* Drop zone */}
          <div
            className={`admin-drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            {previewUrl ? (
              <div>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    objectFit: 'cover',
                  }}
                />
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-sand)', fontSize: '0.9rem' }}>
                  {selectedFile?.name}
                </p>
              </div>
            ) : (
              <div>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                  <path
                    d="M24 8 L24 32 M16 16 L24 8 L32 16"
                    stroke="var(--color-gold)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 28 L8 36 C8 38.2 9.8 40 12 40 L36 40 C38.2 40 40 38.2 40 36 L40 28"
                    stroke="var(--color-gold)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p style={{ fontFamily: 'var(--font-display)', color: 'var(--color-sand)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  Drag & drop an image here, or click to browse
                </p>
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-sand-dark)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Accepts JPG, PNG, WebP, GIF
                </p>
              </div>
            )}

            {uploading && (
              <div className="admin-progress-bar">
                <div className="admin-progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>

          {/* Form fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--color-sand-dark)',
                  marginBottom: '0.5rem',
                }}
              >
                Title
              </label>
              <input
                className="admin-input"
                type="text"
                placeholder="Image title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--color-sand-dark)',
                  marginBottom: '0.5rem',
                }}
              >
                Category
              </label>
              <select
                className="admin-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as GalleryImage['category'])}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <button
              className="admin-btn"
              onClick={handleUpload}
              disabled={!selectedFile || !title.trim() || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        </div>

        {/* Image Management Grid */}
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              color: 'var(--color-gold)',
              letterSpacing: '0.08em',
              marginBottom: '1.5rem',
            }}
          >
            Gallery Images ({images.length})
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div
                className="sphinx-pulse"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, var(--color-gold), var(--color-gold-dim))',
                  margin: '0 auto 1rem',
                }}
              />
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-sand-dark)' }}>Loading images...</p>
            </div>
          ) : images.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-sand-dark)', fontSize: '1rem' }}>
                No images uploaded yet. Upload your first artwork above.
              </p>
            </div>
          ) : (
            <div className="admin-image-grid">
              {images.map((img) => (
                <div key={img.id} className="admin-image-card">
                  <div
                    style={{
                      width: '100%',
                      height: '180px',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      loading="lazy"
                    />
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.9rem',
                          color: 'var(--color-sand-light)',
                          letterSpacing: '0.03em',
                          margin: 0,
                          flex: 1,
                          marginRight: '0.5rem',
                        }}
                      >
                        {img.title}
                      </h3>
                      <span className="category-badge">{img.category}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.75rem',
                          color: 'var(--color-sand-dark)',
                        }}
                      >
                        {formatDate(img.uploadedAt)}
                      </span>
                      <button className="admin-btn-danger" onClick={() => handleDelete(img.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
