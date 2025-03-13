import React, { useState } from "react";
import { useParams } from 'react-router-dom';
import { useCMSStore } from '../../store/cms';
import { useQuery, useQueryClient } from 'react-query';
import { api, useApiErrorHandler } from '../../api/client';
import { ApiResponse, BaseRecord } from '../../types/api';
import { Pencil, Plus } from 'lucide-react';
import { FormModal } from '../forms/FormModal';
import { getThemeClasses } from '../theme/ThemeProvider';
import { ErrorBoundary } from '../ErrorBoundary';
import "./VideoGallery.css";

export interface Video extends BaseRecord {
  videoID: string;
  name: string;
  description: string;
  source: string; // Can be 'local', 'youtube', 'vimeo'
  filename: string;
  hero: string;
  heroUrl: string;
  labels: string;
  posterUrl: string;
  mediaType: string;
  // For external videos
  externalVideoId?: string; // YouTube or Vimeo ID
}

const VideoPlayer: React.FC<{ video: Video }> = ({ video }) => {
  // Get a valid video ID, falling back to videoID if externalVideoId is missing
  const videoId = video.externalVideoId || video.videoID;
  
  // Handle different video sources, but ensure we have a valid ID
  if (video.source === 'youtube' && videoId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        className="video-player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  } else if (video.source === 'vimeo' && videoId) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${videoId}`}
        className="video-player"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  } else {
    // Default to local video player or show a placeholder if heroUrl is missing
    return (
      <video
        src={video.heroUrl || ''}
        poster={video.posterUrl || ''}
        controls
        className="video-player"
      >
        <source src={video.heroUrl || ''} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }
};

const VideoGalleryContent: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const config = useCMSStore((state) => state.config);
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [modal, setModal] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; recordId?: string }>({
    isOpen: false,
    mode: 'create'
  });
  const queryClient = useQueryClient();
  const handleApiError = useApiErrorHandler();

  if (!config || !tableId || !config.cms.tables[tableId]) {
    return <div className={`${themeClasses.text} text-center p-6`}>Table not found</div>;
  }

  const table = config.cms.tables[tableId];

  const { data: apiResponse, isLoading, error } = useQuery<ApiResponse<Video>, Error>(
    ['tableData', tableId],
    async () => {
      try {
        const response = await api.get<ApiResponse<Video>>(table.route);
        if (!response.data) {
          throw new Error('No data received from API');
        }
        // Transform the response to ensure heroUrl and posterUrl are set
        const data = response.data;
        if (!Array.isArray(data.data)) {
          data.data = [data.data];
        }
        data.data = data.data.map(video => {
          const processed = {
            ...video,
            // For backward compatibility
            source: video.source || 'local',
            mediaType: video.mediaType || 'video'
          };
          
          // Ensure we have a valid videoID
          processed.videoID = processed.videoID || '';
          
          // Set poster and video URLs based on source
          if (processed.source === 'local') {
            processed.heroUrl = processed.heroUrl || (processed.videoID ? `http://localhost:5173/stream/${processed.videoID}` : '');
            processed.posterUrl = processed.posterUrl || (processed.hero ? `http://localhost:5173/img/${processed.hero}` : '');
          } else if (processed.source === 'youtube' || processed.source === 'vimeo') {
            // Get the video ID (from externalVideoId or fallback to videoID)
            const videoId = processed.externalVideoId || processed.videoID;
            
            // For YouTube/Vimeo, we'll use their thumbnails if no local poster is specified
            if (!processed.posterUrl && videoId) {
              if (processed.source === 'youtube') {
                processed.posterUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
              }
              // For Vimeo, we'll use a default placeholder if no poster is provided
              // (Vimeo requires an API call to get the thumbnail)
              else if (processed.source === 'vimeo') {
                processed.posterUrl = processed.posterUrl || '/assets/vimeo-placeholder.jpg';
              }
            }
            
            // Store the videoId for consistent reference
            processed.externalVideoId = videoId;
          }
          
          return processed;
        });
        return data;
      } catch (err) {
        const apiError = handleApiError(err);
        throw new Error(apiError.message);
      }
    }
  );

  const videos = apiResponse?.data || [];

  if (isLoading) {
    return <div className={`${themeClasses.text} text-center p-6`}>Loading...</div>;
  }

  if (error) {
    return <div className={`${themeClasses.text} text-center p-6 text-red-500`}>Error: {error.message}</div>;
  }

  const handleSelectVideo = (video: Video) => {
    setSelectedVideo(video);
  };

  const openEditModal = (video: Video) => {
    setModal({ isOpen: true, mode: 'edit', recordId: video.id });
  };

  const openNewModal = () => {
    setModal({ isOpen: true, mode: 'create' });
  };

  return (
    <div className={`container ${themeClasses.primary}`}>
      {/* Sidebar with video cards and a New Video button */}
      <div className={`sidebar ${themeClasses.secondary}`}>
        <button 
          className={`${themeClasses.accent} text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity flex items-center gap-2`} 
          onClick={openNewModal}
        >
          <Plus className="h-5 w-5" />
          New Video
        </button>
        {videos.map((video) => (
          <div
            key={video.id}
            className={`video-card ${themeClasses.modalBackground} ${
              selectedVideo && selectedVideo.id === video.id ? "active" : ""
            }`}
            onClick={() => handleSelectVideo(video)}
          >
            <img 
              src={video.posterUrl || '/assets/default-video-thumbnail.jpg'} 
              alt={video.name} 
              className="video-hero"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/assets/default-video-thumbnail.jpg';
              }} 
            />
            <div className={`video-title ${themeClasses.text}`}>{video.name}</div>
            {video.source !== 'local' && (
              <div className={`video-source-badge ${video.source}`}>
                {video.source}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main view with video player and details */}
      <div className={`main ${themeClasses.modalBackground}`}>
        {selectedVideo ? (
          <div className="video-player-container">
            <VideoPlayer video={selectedVideo} />
            <div className="video-info">
              <div className="video-details">
                <h2 className={themeClasses.text}>{selectedVideo.name}</h2>
                <p className={themeClasses.secondaryText}>{selectedVideo.description}</p>
                {selectedVideo.source !== 'local' && (
                  <span className={`${themeClasses.secondaryText} text-sm`}>
                    Source: {selectedVideo.source}
                  </span>
                )}
              </div>
              <div
                className="edit-icon"
                title="Edit Video"
                onClick={() => selectedVideo && openEditModal(selectedVideo)}
              >
                <Pencil className="h-6 w-6" />
              </div>
            </div>
          </div>
        ) : (
          <div className={`no-video ${themeClasses.secondaryText}`}>Select a video to play</div>
        )}
      </div>

      {/* Modal */}
      <FormModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, mode: 'create' })}
        tableId={tableId}
        recordId={modal.recordId}
        mode={modal.mode}
      />
    </div>
  );
};

const VideoGallery: React.FC = () => {
  return (
    <ErrorBoundary>
      <VideoGalleryContent />
    </ErrorBoundary>
  );
};

export default VideoGallery;