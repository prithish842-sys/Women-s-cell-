import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  ArrowRight,
  Calendar,
  Folder,
  Image as ImageIcon,
  ImagePlus,
  RefreshCw,
} from 'lucide-react';

import api from '../../utils/api.js';

import { GalleryFolderAlbum } from '../../components/gallery/AnimatedGalleryFolder.js';

import { GalleryFolderSkeleton } from '../../components/common/Skeleton.js';

import {
  assignImageFallback,
  galleryFallbackImage,
} from '../../utils/imageFallback.js';
import { ProgressiveImage } from '../../components/common/ProgressiveImage.js';

import {
  PortalHero,
  SectionHeading,
} from '../../components/common/ReferenceChrome.js';

import { mobilePageHeroImages, pageHeroImages } from '../../utils/pageHeroImages.js';

const folderTones = [
  'from-violet-600 to-purple-500',
  'from-pink-600 to-rose-500',
  'from-blue-600 to-blue-500',
  'from-teal-600 to-cyan-500',
  'from-amber-500 to-orange-500',
  'from-emerald-600 to-teal-500',
];

interface GalleryHighlight {
  _id: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  altText?: string;
  album: GalleryFolderAlbum;
}

export const Gallery: React.FC = () => {
  const [albums, setAlbums] = useState<GalleryFolderAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllAlbums, setShowAllAlbums] = useState(false);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get('category') || '';

  const fetchAlbums = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/public/gallery');

      if (response.data?.success) {
        setAlbums(
          Array.isArray(response.data.data)
            ? response.data.data
            : [],
        );
      } else {
        setAlbums([]);
        setError('Failed to fetch gallery albums.');
      }
    } catch (err) {
      console.error('Error loading public gallery:', err);
      setAlbums([]);
      setError(
        'Error loading the gallery albums. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAlbums();
  }, [fetchAlbums]);

  const scrollToSection = useCallback(
    (id: string) => {
      const element = document.getElementById(id);

      if (!element) {
        return;
      }

      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      element.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    },
    [],
  );

  const categories = useMemo(() => {
    const grouped = new Map<
      string,
      GalleryFolderAlbum[]
    >();

    albums.forEach((album) => {
      const category =
        album.category?.trim() || 'General';

      const current =
        grouped.get(category) || [];

      grouped.set(category, [
        ...current,
        album,
      ]);
    });

    return Array.from(grouped.entries());
  }, [albums]);

  const visibleAlbums = useMemo(() => {
    if (!selectedCategory) {
      return albums;
    }

    return albums.filter((album) => {
      const category =
        album.category?.trim() || 'General';

      return category === selectedCategory;
    });
  }, [albums, selectedCategory]);

  const displayedAlbums = useMemo(() => {
    if (showAllAlbums) {
      return visibleAlbums;
    }

    return visibleAlbums.slice(0, 6);
  }, [visibleAlbums, showAllAlbums]);

  const highlights = useMemo(() => {
    const result: GalleryHighlight[] = [];

    visibleAlbums.forEach((album) => {
      if (
        Array.isArray(album.previewImages) &&
        album.previewImages.length > 0
      ) {
        album.previewImages
          .slice(0, 2)
          .forEach((preview) => {
            result.push({
              _id: preview._id,
              imageUrl: preview.imageUrl,
              thumbnailUrl:
                preview.thumbnailUrl,
              caption: preview.caption,
              altText: preview.altText,
              album,
            });
          });

        return;
      }

      result.push({
        _id: `${album._id}-cover`,
        imageUrl: album.coverImage || '',
        thumbnailUrl:
          album.coverImage || '',
        caption: album.title,
        altText: album.title,
        album,
      });
    });

    return result.slice(0, 12);
  }, [visibleAlbums]);

  const handleExploreAlbums = () => {
    setShowAllAlbums(false);

    requestAnimationFrame(() => {
      scrollToSection('albums');
    });
  };

  const handleCategorySelect = (
    category: string,
  ) => {
    setShowAllAlbums(false);

    setSearchParams({
      category,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToSection('gallery-albums');
      });
    });
  };

  const handleClearCategory = () => {
    setSearchParams({});
    setShowAllAlbums(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToSection('albums');
      });
    });
  };

  const handleViewFullGallery = () => {
    if (selectedCategory) {
      setSearchParams({});
    }

    setShowAllAlbums(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToSection('gallery-albums');
      });
    });
  };

  const handleAlbumOpen = (
    slug?: string,
  ) => {
    if (!slug) {
      return;
    }

    navigate(`/gallery/${slug}`);
  };

  const albumSectionTitle =
    selectedCategory
      ? `${selectedCategory.replace(
          /_/g,
          ' ',
        )} Albums`
      : showAllAlbums
        ? 'All Albums'
        : 'Featured Albums';

  return (
    <div className="reference-shell">
      {/* =============================================================== */}
      {/* HERO                                                            */}
      {/* =============================================================== */}

      <PortalHero
        image={pageHeroImages.gallery}
                    mobileImage={mobilePageHeroImages.gallery}
mobileImagePosition="57% center"
          mobileImageWidth="100%"
        title="Gallery"
        subtitle="Moments. Memories. Impact."
        copy="A glimpse of the incredible events, achievements and activities by Singa Pen Portal and women across campuses."
        showText={false}
      >
        <div className="mt-6 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={handleExploreAlbums}
            className="inline-flex items-center gap-2 rounded-md bg-[#075cff] px-5 py-3 text-sm font-black text-white transition-colors hover:bg-[#0648d9]"
          >
            Explore Albums
            <ArrowRight className="h-4 w-4" />
          </button>

          <Link
            to="/admin/gallery"
            className="inline-flex items-center gap-2 rounded-md bg-[#e91670] px-5 py-3 text-sm font-black text-white transition-colors hover:bg-[#c71260]"
          >
            Upload Photos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PortalHero>

      {/* =============================================================== */}
      {/* MAIN CONTENT                                                    */}
      {/* =============================================================== */}

      <main
        id="albums"
        className="reference-container scroll-mt-24 space-y-7 py-6 pb-10"
      >
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <GalleryFolderSkeleton
                key={index}
              />
            ))}
          </div>
        ) : error ? (
          <div className="reference-card mx-auto flex max-w-lg flex-col items-center gap-3 p-6 text-center">
            <RefreshCw className="h-8 w-8 text-[#e91670]" />

            <p className="text-sm font-bold text-[#e91670]">
              {error}
            </p>

            <button
              type="button"
              onClick={() => {
                void fetchAlbums();
              }}
              className="inline-flex items-center gap-2 rounded-md bg-[#e91670] px-4 py-2 text-xs font-black text-white transition-colors hover:bg-[#c71260]"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : albums.length === 0 ? (
          <div className="reference-card mx-auto max-w-lg p-10 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-[#8a97b4]" />

            <p className="mt-3 text-lg font-black text-[#06123a]">
              No albums discovered
            </p>

            <p className="mt-1 text-sm font-semibold leading-6 text-[#52617f]">
              Published gallery folders will
              appear here once albums are added.
            </p>
          </div>
        ) : (
          <>
            {/* ========================================================= */}
            {/* BROWSE BY CATEGORY                                       */}
            {/* ========================================================= */}

            <section>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <SectionHeading
                  title="Browse by Category"
                  caption="Explore images from events, activities and achievements."
                />

                {selectedCategory ? (
                  <button
                    type="button"
                    onClick={handleClearCategory}
                    className="inline-flex items-center gap-2 rounded-md border border-[#075cff] px-4 py-2 text-sm font-black text-[#075cff] transition-colors hover:bg-[#075cff] hover:text-white"
                  >
                    View All Categories
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                {categories
                  .slice(0, 6)
                  .map(
                    (
                      [category, items],
                      index,
                    ) => (
                      <button
                        type="button"
                        key={category}
                        onClick={() =>
                          handleCategorySelect(
                            category,
                          )
                        }
                        className={`reference-card flex min-h-[120px] gap-4 p-4 text-left transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
                          selectedCategory ===
                          category
                            ? 'ring-2 ring-[#075cff]'
                            : ''
                        }`}
                      >
                        <span
                          className={`grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${
                            folderTones[
                              index %
                                folderTones.length
                            ]
                          } text-white`}
                        >
                          <Folder className="h-8 w-8 fill-white/20" />
                        </span>

                        <span className="min-w-0">
                          <strong className="block line-clamp-2 text-sm font-black leading-5 text-[#075cff]">
                            {category.replace(
                              /_/g,
                              ' ',
                            )}
                          </strong>

                          <small className="mt-1 block text-[0.68rem] font-bold text-[#52617f]">
                            {items.length}{' '}
                            published album
                            {items.length === 1
                              ? ''
                              : 's'}
                          </small>

                          <span className="mt-3 inline-flex text-[#075cff]">
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </span>
                      </button>
                    ),
                  )}
              </div>
            </section>

            {/* ========================================================= */}
            {/* ALBUMS                                                    */}
            {/* ========================================================= */}

            <section
              id="gallery-albums"
              className="scroll-mt-24"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <SectionHeading
                  title={albumSectionTitle}
                  caption={
                    selectedCategory
                      ? `Explore published albums from ${selectedCategory.replace(
                          /_/g,
                          ' ',
                        )}.`
                      : 'Explore published albums from recent events and activities.'
                  }
                />

                <div className="flex flex-wrap gap-2">
                  {selectedCategory ? (
                    <button
                      type="button"
                      onClick={handleClearCategory}
                      className="inline-flex items-center gap-2 rounded-md border border-[#d7e0f0] bg-white px-4 py-2 text-sm font-black text-[#52617f] transition-colors hover:border-[#075cff] hover:text-[#075cff]"
                    >
                      All Albums
                    </button>
                  ) : null}

                  {!showAllAlbums &&
                  visibleAlbums.length > 6 ? (
                    <button
                      type="button"
                      onClick={
                        handleViewFullGallery
                      }
                      className="inline-flex items-center gap-2 rounded-md bg-[#075cff] px-4 py-2 text-sm font-black text-white transition-colors hover:bg-[#0648d9]"
                    >
                      View Full Gallery
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : null}

                  {showAllAlbums ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAllAlbums(false);

                        requestAnimationFrame(
                          () => {
                            scrollToSection(
                              'gallery-albums',
                            );
                          },
                        );
                      }}
                      className="inline-flex items-center gap-2 rounded-md border border-[#075cff] px-4 py-2 text-sm font-black text-[#075cff] transition-colors hover:bg-[#075cff] hover:text-white"
                    >
                      Show Featured Only
                    </button>
                  ) : null}
                </div>
              </div>

              {displayedAlbums.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                  {displayedAlbums.map(
                    (album) => (
                      <AlbumCard
                        key={album._id}
                        album={album}
                        onOpen={() =>
                          handleAlbumOpen(
                            album.slug,
                          )
                        }
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="reference-card p-8 text-center">
                  <Folder className="mx-auto h-10 w-10 text-[#8a97b4]" />

                  <p className="mt-3 text-sm font-black text-[#06123a]">
                    No albums found in this
                    category.
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleClearCategory
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#075cff] px-4 py-2 text-xs font-black text-white"
                  >
                    View All Albums
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </section>

            {/* ========================================================= */}
            {/* GALLERY HIGHLIGHTS                                        */}
            {/* ========================================================= */}

            <section className="rounded-xl bg-[#f1f6ff] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <SectionHeading
                  title="Gallery Highlights"
                  caption="A quick look at the vibrant moments from our community."
                />

                <button
                  type="button"
                  onClick={
                    handleViewFullGallery
                  }
                  className="hidden items-center gap-2 rounded-md border border-[#075cff] px-4 py-2 text-sm font-black text-[#075cff] transition-colors hover:bg-[#075cff] hover:text-white sm:inline-flex"
                >
                  View Full Gallery
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {highlights.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">
                  {highlights.map(
                    (preview) => (
                      <button
                        type="button"
                        key={`${preview.album._id}-${preview._id}`}
                        onClick={() =>
                          handleAlbumOpen(
                            preview.album
                              .slug,
                          )
                        }
                        className="group block aspect-[1.35/1] overflow-hidden rounded-lg bg-[#e8eef9]"
                      >
                        <ProgressiveImage
                          src={
                            preview.thumbnailUrl ||
                              preview.imageUrl ||
                              preview.album.coverImage
                          }
                          fallbackSrc={galleryFallbackImage}
                          alt={
                            preview.altText ||
                            preview.caption ||
                            preview.album
                              .title
                          }
                          loading="lazy"
                          decoding="async"
                          onError={(
                            event,
                          ) =>
                            assignImageFallback(
                              event,
                              galleryFallbackImage,
                            )
                          }
                          wrapperClassName="h-full w-full"
                          imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </button>
                    ),
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#d8e1f2] bg-white/70 p-8 text-center">
                  <ImageIcon className="mx-auto h-9 w-9 text-[#8a97b4]" />

                  <p className="mt-3 text-xs font-bold text-[#52617f]">
                    Gallery highlights will
                    appear here when published
                    images are available.
                  </p>
                </div>
              )}

              <div className="mt-5 sm:hidden">
                <button
                  type="button"
                  onClick={
                    handleViewFullGallery
                  }
                  className="inline-flex items-center gap-2 rounded-md border border-[#075cff] px-4 py-2 text-sm font-black text-[#075cff]"
                >
                  View Full Gallery
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

/* ==========================================================================
   ALBUM CARD
   ========================================================================== */

const AlbumCard: React.FC<{
  album: GalleryFolderAlbum;
  onOpen: () => void;
}> = ({
  album,
  onOpen,
}) => {
  const imageSource =
    album.coverImage ||
    album.previewImages?.[0]?.imageUrl;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="reference-card group block w-full overflow-hidden text-left transition duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[1.42/1] overflow-hidden bg-[#e8eef9]">
        <ProgressiveImage
          src={imageSource}
          fallbackSrc={galleryFallbackImage}
          alt={album.title}
          loading="lazy"
          decoding="async"
          onError={(event) =>
            assignImageFallback(
              event,
              galleryFallbackImage,
            )
          }
          wrapperClassName="h-full w-full"
          imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(3,16,57,0.95))] p-3 text-white">
          <strong className="block line-clamp-2 text-sm font-black leading-5">
            {album.title}
          </strong>

          {album.eventDate ? (
            <small className="mt-1 flex items-center gap-1 text-[0.68rem] font-semibold text-white/75">
              <Calendar className="h-3 w-3 shrink-0" />

              {new Date(
                album.eventDate,
              ).toLocaleDateString(
                'en-US',
                {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                },
              )}
            </small>
          ) : null}
        </div>

        {album.isFeatured ? (
          <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-[#e91670] text-white shadow-md">
            <ImagePlus className="h-4 w-4" />
          </span>
        ) : null}
      </div>
    </button>
  );
};

export default Gallery;
