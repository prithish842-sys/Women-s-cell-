import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { Image, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { AnimatedGalleryFolder, GalleryFolderAlbum } from '../../components/gallery/AnimatedGalleryFolder.js';
import { GalleryFolderSkeleton } from '../../components/common/Skeleton.js';

export const Gallery: React.FC = () => {
  const [albums, setAlbums] = useState<GalleryFolderAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAlbumId, setExpandedAlbumId] = useState<string | null>(null);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      setError(null);
      setExpandedAlbumId(null);
      const res = await api.get('/public/gallery');
      if (res.data.success) {
        setAlbums(res.data.data);
      } else {
        setError('Failed to fetch gallery albums.');
      }
    } catch (err) {
      console.error(err);
      setError('Error loading the gallery albums. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  return (
    <div className="min-h-screen bg-matte-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-matte-blush/20 border border-matte-rose text-matte-maroon text-xs font-semibold tracking-wider uppercase font-sans">
            <Sparkles className="w-3.5 h-3.5 text-matte-gold" />
            <span>Empowerment Photo Gallery</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-matte-maroon tracking-tight">
            Our Shared Journey
          </h1>
          <p className="text-sm sm:text-base text-matte-charcoal/70 max-w-2xl mx-auto font-sans leading-relaxed">
            Capturing the milestones, collaborative tech bootcamps, safety workshops, and entrepreneurship bazaars organized by the Women's Empowerment Cell and Singa Pen Club.
          </p>
          <div className="w-24 h-0.5 bg-matte-gold mx-auto mt-4 rounded-full"></div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-busy="true">
            {Array.from({ length: 6 }).map((_, n) => <GalleryFolderSkeleton key={n} />)}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-matte-rose/30 text-matte-maroon p-6 rounded-2xl flex flex-col items-center gap-3 max-w-lg mx-auto text-center">
            <AlertCircle className="w-6 h-6 shrink-0 text-matte-rose" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={fetchAlbums} className="inline-flex items-center gap-2 rounded-md bg-matte-maroon px-4 py-2 text-xs font-bold text-matte-white">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-20 bg-matte-cream border border-dashed border-matte-beige rounded-2xl max-w-lg mx-auto p-8 space-y-3">
            <Image className="w-12 h-12 text-matte-charcoal/30 mx-auto" />
            <p className="font-serif text-lg font-semibold text-matte-charcoal">No albums discovered</p>
            <p className="text-xs text-matte-charcoal/60">Published gallery folders will appear here once albums are added.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {albums.map((album, idx) => (
              <AnimatedGalleryFolder
                key={album._id}
                album={album}
                index={idx}
                expanded={expandedAlbumId === album._id}
                onExpand={setExpandedAlbumId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
