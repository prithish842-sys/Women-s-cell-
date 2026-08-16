import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api.js';
import { 
  PlusCircle, Edit2, Trash2, Image, Upload, FileText, Calendar, 
  MapPin, CheckCircle, AlertCircle, X, ArrowLeft, ArrowRight, Sparkles 
} from 'lucide-react';

interface GalleryAlbum {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  coverImage: string;
  eventDate?: string;
  venue?: string;
  organizedBy?: string;
  isFeatured: boolean;
  isPublished: boolean;
  photoCount: number;
}

interface GalleryImage {
  _id: string;
  imageUrl: string;
  caption?: string;
  displayOrder: number;
  isFeatured: boolean;
}

export const GalleryManager: React.FC = () => {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // View state: 'ALBUM_LIST' | 'ALBUM_FORM' | 'IMAGE_MANAGER'
  const [viewState, setViewState] = useState<'ALBUM_LIST' | 'ALBUM_FORM' | 'IMAGE_MANAGER'>('ALBUM_LIST');
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [albumImages, setAlbumImages] = useState<GalleryImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Album Form State
  const [isEditing, setIsEditing] = useState(false);
  const [albumIdToEdit, setAlbumIdToEdit] = useState<string | null>(null);
  const [albumTitle, setAlbumTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [category, setCategory] = useState('EVENT');
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');
  const [organizedBy, setOrganizedBy] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // New Image Form State
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
  const [imageCaptions, setImageCaptions] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // File Inputs references
  const coverInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: 'EVENT', label: 'College Event' },
    { value: 'CELEBRATION', label: 'Induction/Celebration' },
    { value: 'WORKSHOP', label: 'Technical Workshop' },
    { value: 'AWARENESS_PROGRAM', label: 'Awareness Campaign' },
    { value: 'SINGA_PEN_ACTIVITY', label: 'Singa Pen Club Activity' },
    { value: 'COMPETITION', label: 'In-house/External Competition' },
    { value: 'ENTREPRENEURSHIP', label: 'Entrepreneurship Stall/Bazaar' },
    { value: 'SKILL_DEVELOPMENT', label: 'Professional Skill Dev' },
    { value: 'OTHER', label: 'Other Activity' }
  ];

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/gallery/albums');
      if (res.data.success) {
        setAlbums(res.data.data);
      } else {
        setError('Failed to fetch albums list.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading dashboard gallery albums.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string, isErr = false) => {
    if (isErr) {
      setError(msg);
      setSuccess(null);
    } else {
      setSuccess(msg);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  // Open Form to Create Album
  const handleOpenCreate = () => {
    setIsEditing(false);
    setAlbumIdToEdit(null);
    setAlbumTitle('');
    setShortDesc('');
    setFullDesc('');
    setCategory('EVENT');
    setEventDate('');
    setVenue('');
    setOrganizedBy('');
    setIsFeatured(false);
    setIsPublished(true);
    setCoverFile(null);
    setCoverPreview(null);
    setViewState('ALBUM_FORM');
  };

  // Open Form to Edit Album
  const handleOpenEdit = (album: GalleryAlbum) => {
    setIsEditing(true);
    setAlbumIdToEdit(album._id);
    setAlbumTitle(album.title);
    setShortDesc(album.shortDescription);
    setFullDesc(album.fullDescription || '');
    setCategory(album.category);
    setEventDate(album.eventDate ? album.eventDate.split('T')[0] : '');
    setVenue(album.venue || '');
    setOrganizedBy(album.organizedBy || '');
    setIsFeatured(album.isFeatured);
    setIsPublished(album.isPublished);
    setCoverFile(null);
    setCoverPreview(album.coverImage);
    setViewState('ALBUM_FORM');
  };

  // Handle Cover File Change
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 8 * 1024 * 1024) {
        showNotification('Cover photo size exceeds the allowed limit of 8MB.', true);
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // Create or Update Album API
  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumTitle.trim() || !shortDesc.trim()) {
      showNotification('Please fill out the album title and short description.', true);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', albumTitle);
      formData.append('shortDescription', shortDesc);
      formData.append('fullDescription', fullDesc);
      formData.append('category', category);
      if (eventDate) formData.append('eventDate', eventDate);
      if (venue) formData.append('venue', venue);
      if (organizedBy) formData.append('organizedBy', organizedBy);
      formData.append('isFeatured', String(isFeatured));
      formData.append('isPublished', String(isPublished));
      if (coverFile) {
        formData.append('coverImage', coverFile);
      }

      let res;
      if (isEditing && albumIdToEdit) {
        res = await api.put(`/admin/gallery/albums/${albumIdToEdit}`, formData);
      } else {
        if (!coverFile) {
          showNotification('Please select a cover image for the new album.', true);
          setLoading(false);
          return;
        }
        res = await api.post('/admin/gallery/albums', formData);
      }

      if (res.data.success) {
        showNotification(isEditing ? 'Album successfully updated!' : 'New Album successfully created!');
        fetchAlbums();
        setViewState('ALBUM_LIST');
      } else {
        showNotification(res.data.message || 'Error saving album details.', true);
      }
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.message || 'Error while communicating with server.', true);
    } finally {
      setLoading(false);
    }
  };

  // Delete Album
  const handleDeleteAlbum = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the album "${title}"? This will permanently remove all photos inside it.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.delete(`/admin/gallery/albums/${id}`);
      if (res.data.success) {
        showNotification('Album and all its associated photos successfully deleted.');
        fetchAlbums();
      } else {
        showNotification(res.data.message || 'Error deleting album.', true);
      }
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.message || 'Error during album deletion.', true);
    } finally {
      setLoading(false);
    }
  };

  // Open Image Manager View for specific Album
  const handleOpenImageManager = async (album: GalleryAlbum) => {
    setSelectedAlbum(album);
    setViewState('IMAGE_MANAGER');
    setAlbumImages([]);
    setSelectedImages(null);
    setImageCaptions([]);
    if (imagesInputRef.current) imagesInputRef.current.value = '';
    await fetchAlbumImages(album._id);
  };

  // Fetch images belonging to the album
  const fetchAlbumImages = async (albumId: string) => {
    try {
      setLoadingImages(true);
      const res = await api.get(`/admin/gallery/albums/${albumId}`);
      if (res.data.success) {
        setAlbumImages(res.data.data.images || []);
      } else {
        showNotification('Failed to retrieve album photos.', true);
      }
    } catch (err: any) {
      console.error(err);
      showNotification('Error loading album photos.', true);
    } finally {
      setLoadingImages(false);
    }
  };

  // Handle Multi-file Selection for Album
  const handleMultipleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = e.target.files;
      if (files.length > 10) {
        showNotification('You can upload a maximum of 10 images at a time.', true);
        if (imagesInputRef.current) imagesInputRef.current.value = '';
        return;
      }
      setSelectedImages(files);
      // Initialize captions array
      const initialCaptions = Array.from(files).map(() => '');
      setImageCaptions(initialCaptions);
    }
  };

  const handleCaptionChange = (index: number, val: string) => {
    const updated = [...imageCaptions];
    updated[index] = val;
    setImageCaptions(updated);
  };

  // Upload Images to Album API
  const handleUploadImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlbum || !selectedImages || selectedImages.length === 0) {
      showNotification('Please select at least one photo file to upload.', true);
      return;
    }

    try {
      setUploadProgress('Uploading files... Please wait.');
      const formData = new FormData();
      formData.append('albumId', selectedAlbum._id);
      
      // Append files
      for (let i = 0; i < selectedImages.length; i++) {
        formData.append('photos', selectedImages[i]);
      }
      // Append captions list
      formData.append('captions', JSON.stringify(imageCaptions));

      const res = await api.post(`/admin/gallery/albums/${selectedAlbum._id}/images`, formData);

      if (res.data.success) {
        showNotification(`Successfully uploaded ${selectedImages.length} photos!`);
        setSelectedImages(null);
        setImageCaptions([]);
        if (imagesInputRef.current) imagesInputRef.current.value = '';
        fetchAlbumImages(selectedAlbum._id);
        // Refresh master albums list to update photo count
        fetchAlbums();
      } else {
        showNotification(res.data.message || 'Error during photo upload.', true);
      }
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.message || 'Error while uploading photos.', true);
    } finally {
      setUploadProgress(null);
    }
  };

  // Delete Individual Image
  const handleDeleteImage = async (imageId: string) => {
    if (!selectedAlbum) return;
    if (!window.confirm('Delete this photo from the album permanently?')) {
      return;
    }

    try {
      const res = await api.delete(`/admin/gallery/images/${imageId}`);
      if (res.data.success) {
        showNotification('Photo deleted.');
        fetchAlbumImages(selectedAlbum._id);
        // Refresh master albums list to update photo count
        fetchAlbums();
      } else {
        showNotification(res.data.message || 'Error deleting photo.', true);
      }
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.message || 'Error deleting photo.', true);
    }
  };

  return (
    <div className="space-y-8 fade-in-up">
      {/* Dynamic Header */}
      <section className="border-b border-matte-beige pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-matte-maroon">
            {viewState === 'ALBUM_LIST' && 'Photo Gallery Hub'}
            {viewState === 'ALBUM_FORM' && (isEditing ? 'Modify Album Settings' : 'Create New Gallery Album')}
            {viewState === 'IMAGE_MANAGER' && 'Upload & Organize Photos'}
          </h1>
          <p className="text-xs text-matte-charcoal/60 mt-0.5">
            {viewState === 'ALBUM_LIST' && 'Administer public album entries, cover photos, and event details.'}
            {viewState === 'ALBUM_FORM' && 'Populate administrative information, categories, and background image.'}
            {viewState === 'IMAGE_MANAGER' && `Managing photos inside: ${selectedAlbum?.title}`}
          </p>
        </div>

        <div className="flex gap-2">
          {viewState !== 'ALBUM_LIST' && (
            <button
              onClick={() => setViewState('ALBUM_LIST')}
              className="px-4 py-2 bg-matte-cream hover:bg-matte-beige/40 border border-matte-beige text-matte-maroon rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Albums</span>
            </button>
          )}
          {viewState === 'ALBUM_LIST' && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-matte-maroon hover:bg-matte-maroon/90 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Album</span>
            </button>
          )}
        </div>
      </section>

      {/* Notifications */}
      {error && (
        <div className="bg-rose-50 border border-matte-rose/30 text-matte-maroon p-4 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-matte-rose shrink-0" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-xs font-medium">{success}</p>
        </div>
      )}

      {/* VIEW 1: ALBUM LIST TABLE/GRID */}
      {viewState === 'ALBUM_LIST' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-matte-maroon/20 border-t-matte-maroon"></div>
            </div>
          ) : albums.length === 0 ? (
            <div className="text-center py-16 bg-matte-cream border border-dashed border-matte-beige rounded-2xl p-8 space-y-3 max-w-lg mx-auto">
              <Image className="w-10 h-10 text-matte-charcoal/30 mx-auto" />
              <p className="font-serif text-base font-semibold text-matte-charcoal">No gallery albums built yet</p>
              <p className="text-xs text-matte-charcoal/50">Click "Create Album" above to set up your first media folder.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => (
                <div
                  key={album._id}
                  className="bg-white border border-matte-beige rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Photo */}
                    <div className="relative aspect-video bg-matte-cream overflow-hidden">
                      <img
                        src={album.coverImage}
                        alt={album.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-matte-maroon/90 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border border-white/15">
                        {album.category}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-matte-charcoal/80 text-white text-[9px] font-mono px-2 py-0.5 rounded">
                        {album.photoCount} PHOTOS
                      </div>
                    </div>

                    {/* Album Info */}
                    <div className="p-5 space-y-2">
                      <div className="flex items-center space-x-1 text-[10px] text-matte-charcoal/50 font-sans">
                        <Calendar className="w-3.5 h-3.5 text-matte-rose" />
                        <span>{album.eventDate ? new Date(album.eventDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'No event date'}</span>
                      </div>
                      <h3 className="font-serif text-base font-bold text-matte-maroon line-clamp-1">
                        {album.title}
                      </h3>
                      <p className="text-xs text-matte-charcoal/75 line-clamp-2 leading-relaxed">
                        {album.shortDescription}
                      </p>
                    </div>
                  </div>

                  {/* Actions area */}
                  <div className="px-5 py-4 bg-matte-cream/50 border-t border-matte-beige flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenImageManager(album)}
                      className="px-3 py-1.5 bg-matte-cream hover:bg-matte-blush/20 border border-matte-beige rounded-lg text-[10px] font-bold text-matte-maroon flex items-center space-x-1 cursor-pointer"
                    >
                      <Image className="w-3 h-3 text-matte-rose" />
                      <span>Manage Photos</span>
                    </button>

                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleOpenEdit(album)}
                        className="p-1.5 text-matte-charcoal hover:text-matte-maroon hover:bg-matte-beige/40 rounded transition-colors cursor-pointer"
                        title="Edit Album Settings"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAlbum(album._id, album.title)}
                        className="p-1.5 text-matte-charcoal hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Delete Album"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ALBUM FORM (CREATE/EDIT) */}
      {viewState === 'ALBUM_FORM' && (
        <form onSubmit={handleSaveAlbum} className="bg-white rounded-2xl border border-matte-beige p-6 sm:p-8 space-y-6 max-w-4xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Block: Basic fields */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-matte-charcoal/80">Album Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Pudhumai Penn Scholarship Celebration"
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  className="w-full bg-matte-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none focus:ring-1 focus:ring-matte-maroon"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-matte-charcoal/80">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-matte-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none focus:ring-1 focus:ring-matte-maroon"
                >
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-matte-charcoal/80">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-matte-white border border-matte-beige rounded-xl p-2 text-xs text-matte-charcoal focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-matte-charcoal/80">Venue/Hall</label>
                  <input
                    type="text"
                    placeholder="e.g., Seminar Hall II"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full bg-matte-white border border-matte-beige rounded-xl p-2 text-xs text-matte-charcoal focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-matte-charcoal/80">Organizing Body/Coordinators</label>
                <input
                  type="text"
                  placeholder="e.g., Women's Empowerment Cell & Naan Mudhalvan Wing"
                  value={organizedBy}
                  onChange={(e) => setOrganizedBy(e.target.value)}
                  className="w-full bg-matte-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none"
                />
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center space-x-2 text-xs text-matte-charcoal cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-matte-beige text-matte-maroon focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="font-semibold text-matte-maroon">Feature this Album on Home</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-matte-charcoal cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="rounded border-matte-beige text-matte-maroon focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="font-semibold text-green-700">Publish Immediately</span>
                </label>
              </div>
            </div>

            {/* Right Block: Descriptions & Cover Photo */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-matte-charcoal/80">Short Description *</label>
                <textarea
                  required
                  rows={2}
                  maxLength={160}
                  placeholder="A concise, 1-2 sentence description summarizing the gallery content (max 160 chars)."
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="w-full bg-matte-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none focus:ring-1 focus:ring-matte-maroon resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-matte-charcoal/80">Full Event Report</label>
                <textarea
                  rows={4}
                  placeholder="Elaborate on the guest lectures, milestones achieved, student involvement, and feedback loops..."
                  value={fullDesc}
                  onChange={(e) => setFullDesc(e.target.value)}
                  className="w-full bg-matte-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none focus:ring-1 focus:ring-matte-maroon resize-none"
                />
              </div>

              {/* Cover Photo Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-matte-charcoal/80">Cover Image File * (Max 8MB)</label>
                <div className="flex gap-4 items-center">
                  <div 
                    onClick={() => coverInputRef.current?.click()}
                    className="w-32 h-20 bg-matte-cream rounded-xl border border-dashed border-matte-beige flex flex-col items-center justify-center cursor-pointer hover:border-matte-rose/40 hover:bg-matte-blush/10 transition-all overflow-hidden shrink-0"
                  >
                    {coverPreview ? (
                      <img src={coverPreview} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2">
                        <Upload className="w-4 h-4 text-matte-maroon mx-auto" />
                        <span className="text-[9px] text-matte-charcoal/50 block mt-1">Select File</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={coverInputRef}
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                  <div className="text-xs text-matte-charcoal/60">
                    <p className="font-semibold text-matte-maroon">Album Cover Preview</p>
                    <p className="text-[10px] text-matte-charcoal/40">Only valid image formats (JPEG, PNG, WEBP) are supported.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-matte-beige flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setViewState('ALBUM_LIST')}
              className="px-5 py-2.5 bg-matte-cream hover:bg-matte-beige/40 border border-matte-beige text-matte-maroon rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-matte-maroon hover:bg-matte-maroon/90 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              {loading ? 'Saving Settings...' : (isEditing ? 'Save Changes' : 'Create Album Folder')}
            </button>
          </div>
        </form>
      )}

      {/* VIEW 3: IMAGE MANAGER (MANAGE PHOTOS INSIDE AN ALBUM) */}
      {viewState === 'IMAGE_MANAGER' && selectedAlbum && (
        <div className="space-y-8">
          {/* Header specs info */}
          <div className="bg-matte-cream p-5 rounded-2xl border border-matte-beige flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="inline-block px-2.5 py-0.5 rounded-md bg-matte-maroon text-white text-[9px] font-bold tracking-wider">
                {selectedAlbum.category}
              </div>
              <h2 className="font-serif text-lg font-bold text-matte-maroon">{selectedAlbum.title}</h2>
              <p className="text-xs text-matte-charcoal/60">{selectedAlbum.shortDescription}</p>
            </div>
            <div className="shrink-0 text-xs text-matte-charcoal/50 font-mono">
              ALBUM ID: {selectedAlbum._id}
            </div>
          </div>

          {/* Form to upload new photos */}
          <form onSubmit={handleUploadImages} className="bg-white border border-matte-beige rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-base font-bold text-matte-maroon flex items-center space-x-2">
              <Upload className="w-4 h-4 text-matte-rose" />
              <span>Add Photos to this Folder</span>
            </h3>
            
            <div className="space-y-4">
              <div 
                onClick={() => imagesInputRef.current?.click()}
                className="border-2 border-dashed border-matte-beige hover:border-matte-rose/40 rounded-2xl p-8 text-center bg-matte-cream/50 hover:bg-matte-blush/5 transition-all cursor-pointer"
              >
                <Image className="w-8 h-8 text-matte-maroon/60 mx-auto mb-2" />
                <p className="text-xs font-semibold text-matte-maroon">Drag and drop or click here to choose files</p>
                <p className="text-[10px] text-matte-charcoal/40 mt-1">Upload up to 10 images at a time (Max 8MB per file)</p>
                <input
                  type="file"
                  multiple
                  ref={imagesInputRef}
                  accept="image/*"
                  onChange={handleMultipleImagesChange}
                  className="hidden"
                />
              </div>

              {selectedImages && selectedImages.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-matte-charcoal/70">Configure captions for selected files ({selectedImages.length}):</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
                    {Array.from(selectedImages as FileList).map((file: File, idx) => (
                      <div key={idx} className="bg-matte-cream p-3 rounded-xl border border-matte-beige flex gap-3 items-center">
                        <div className="w-10 h-10 bg-matte-beige rounded overflow-hidden shrink-0">
                          <img src={URL.createObjectURL(file)} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-[10px] text-matte-charcoal/50 truncate mb-1">{file.name}</p>
                          <input
                            type="text"
                            placeholder="Add brief caption (optional)..."
                            value={imageCaptions[idx] || ''}
                            onChange={(e) => handleCaptionChange(idx, e.target.value)}
                            className="w-full bg-white border border-matte-beige rounded-lg p-1.5 text-[10px] text-matte-charcoal focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImages(null);
                        setImageCaptions([]);
                        if (imagesInputRef.current) imagesInputRef.current.value = '';
                      }}
                      className="px-4 py-2 bg-matte-cream hover:bg-matte-beige/40 border border-matte-beige rounded-xl text-xs font-medium text-matte-maroon cursor-pointer"
                    >
                      Clear Selection
                    </button>
                    <button
                      type="submit"
                      disabled={!!uploadProgress}
                      className="px-5 py-2 bg-matte-maroon hover:bg-matte-maroon/90 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      {uploadProgress ? 'Uploading...' : 'Start Upload'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {uploadProgress && (
              <p className="text-xs text-matte-rose font-semibold animate-pulse">{uploadProgress}</p>
            )}
          </form>

          {/* Existing Photos List */}
          <div className="space-y-4">
            <h3 className="font-serif text-base font-bold text-matte-maroon">Existing Album Photos</h3>
            
            {loadingImages ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-matte-maroon/20 border-t-matte-maroon"></div>
              </div>
            ) : albumImages.length === 0 ? (
              <div className="text-center py-12 bg-matte-cream border border-dashed border-matte-beige rounded-2xl p-6 text-xs text-matte-charcoal/50">
                No photos in this album directory. Fill the upload form above to add some.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {albumImages.map((img) => (
                  <div
                    key={img._id}
                    className="group relative bg-white border border-matte-beige rounded-xl overflow-hidden aspect-square flex flex-col justify-between shadow-xs hover:border-matte-rose/30"
                  >
                    <div className="relative flex-grow overflow-hidden bg-matte-cream">
                      <img
                        src={img.imageUrl}
                        alt="Album content"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {/* Delete absolute button */}
                      <button
                        onClick={() => handleDeleteImage(img._id)}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-matte-charcoal hover:text-red-600 rounded-full shadow-sm transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete photo permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {img.caption && (
                      <div className="p-2 bg-matte-cream/50 text-[10px] text-matte-charcoal/80 line-clamp-1 border-t border-matte-beige font-sans">
                        {img.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default GalleryManager;
