import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api.js';
import { Calendar, MapPin, Sparkles, ChevronLeft, User, AlertCircle, Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';
import { GalleryImageLightbox } from '../../components/gallery/GalleryImageLightbox.js';
import { assignImageFallback, galleryFallbackImage, withResolvedImage } from '../../utils/imageFallback.js';

interface GalleryImage {
  _id: string;
  imageUrl: string;
  caption?: string;
  altText?: string;
}

interface AlbumDetails {
  _id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  coverImage?: string;
  eventDate?: string;
  venue?: string;
  organizedBy?: string;
  images: GalleryImage[];
}

export const GalleryAlbumDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [album, setAlbum] = useState<AlbumDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [slug]);

  useEffect(() => {
    const fetchAlbumDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/public/gallery/${slug}`);
        if (res.data.success) {
          setAlbum(res.data.data);
        } else {
          setError('Album not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch album photos.');
      } finally {
        setLoading(false);
        window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
      }
    };
    fetchAlbumDetails();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32 bg-matte-white min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-matte-maroon/20 border-t-matte-maroon"></div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-matte-white py-16 px-4 text-center space-y-6">
        <div className="max-w-md mx-auto bg-rose-50 border border-matte-rose/30 text-matte-maroon p-6 rounded-2xl flex flex-col items-center space-y-3">
          <AlertCircle className="w-8 h-8 text-matte-rose" />
          <p className="font-serif text-lg font-semibold">{error || 'Album not found'}</p>
          <Link
            to="/gallery"
            className="px-4 py-2 bg-matte-maroon text-matte-white rounded-lg text-xs font-medium hover:bg-matte-maroon/90"
          >
            Back to Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-matte-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Back Link */}
        <Link
          to="/gallery"
          className="inline-flex items-center space-x-1 text-xs font-medium text-matte-maroon hover:text-matte-rose transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Gallery Albums</span>
        </Link>

        {/* Album Header Card */}
        <div className="bg-matte-cream border border-matte-beige rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-matte-blush/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-matte-blush/30 border border-matte-rose/30 text-matte-maroon text-[10px] font-bold tracking-wider uppercase font-sans">
              <Sparkles className="w-3 h-3 text-matte-gold" />
              <span>{album.category.replace('_', ' ')}</span>
            </div>
            {album.eventDate && (
              <span className="text-xs text-matte-charcoal/60 font-sans flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-matte-rose" />
                <span>{new Date(album.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </span>
            )}
          </div>

          <div className="space-y-4 max-w-4xl">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-matte-maroon tracking-tight leading-tight">
              {album.title}
            </h1>
            {album.venue && (
              <div className="flex items-center space-x-2 text-xs font-sans text-matte-charcoal/60">
                <MapPin className="w-4 h-4 text-matte-rose" />
                <span className="font-medium">{album.venue}</span>
                {album.organizedBy && (
                  <>
                    <span className="text-matte-beige">•</span>
                    <span className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-matte-rose" />
                      <span>By: {album.organizedBy}</span>
                    </span>
                  </>
                )}
              </div>
            )}
            <div className="traditional-line my-4"></div>
            <p className="text-sm sm:text-base text-matte-charcoal/80 leading-relaxed font-sans font-light">
              {album.fullDescription || album.shortDescription}
            </p>
          </div>
        </div>

        {/* Photo Grid Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-matte-maroon flex items-center space-x-2">
              <span>Captured Moments</span>
              <span className="font-mono text-xs px-2.5 py-1 bg-matte-cream border border-matte-beige rounded-full text-matte-maroon/70">
                {album.images.length} photos
              </span>
            </h2>
          </div>

          {album.images.length === 0 ? (
            <div className="text-center py-20 bg-matte-cream border border-dashed border-matte-beige rounded-2xl max-w-lg mx-auto p-8 space-y-2">
              <Sparkles className="w-10 h-10 text-matte-charcoal/30 mx-auto" />
              <p className="font-serif text-base font-semibold text-matte-charcoal">No photos inside this album yet</p>
              <p className="text-xs text-matte-charcoal/50">Admin/Faculty coordinators have not uploaded photos yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {album.images.map((image, index) => (
                <motion.div
                  key={image._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="group relative bg-matte-cream rounded-xl overflow-hidden border border-matte-beige hover:border-matte-rose/30 shadow-sm cursor-pointer aspect-square"
                  onClick={() => setLightboxIndex(index)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open image ${index + 1} from ${album.title}`}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setLightboxIndex(index);
                    }
                  }}
                >
                  <img
                    src={withResolvedImage(image.imageUrl, galleryFallbackImage)}
                    alt={image.altText || image.caption || `${album.title} photo ${index + 1}`}
                    referrerPolicy="no-referrer"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    onError={(event) => assignImageFallback(event, galleryFallbackImage)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Hover Caption Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-matte-charcoal/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                    <div className="flex items-center justify-between text-white">
                      <p className="text-xs font-sans line-clamp-2 font-medium">
                        {image.caption || 'Click to view full screen'}
                      </p>
                      <Maximize2 className="w-4 h-4 text-matte-gold shrink-0 ml-2" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <GalleryImageLightbox
        images={album.images}
        index={lightboxIndex}
        albumTitle={album.title}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
    </div>
  );
};
