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
  source: string;
  filename: string;
  hero: string;
  heroUrl: string;
  labels: string;
  posterUrl: string;
  mediaType: string;
}

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
        data.data = data.data.map(video => ({
          ...video,
          // Ensure each video has an id (use videoID as fallback)
          id: video.id || video.videoID || `video-${Math.random().toString(36).substr(2, 9)}`,
          heroUrl: video.heroUrl || `http://localhost:5173/stream/${video.videoID}`,
          posterUrl: video.posterUrl || `http://localhost:5173/img/${video.hero}`,
          mediaType: 'video'
        }));
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
            <img src={video.posterUrl} alt={video.name} className="video-hero" />
            <div className={`video-title ${themeClasses.text}`}>{video.name}</div>
          </div>
        ))}
      </div>

      {/* Main view with video player and details */}
      <div className={`main ${themeClasses.modalBackground}`}>
        {selectedVideo ? (
          <div className="video-player-container">
            <video
              src={selectedVideo.heroUrl}
              poster={selectedVideo.posterUrl}
              controls
              className="video-player"
            />
            <div className="video-info">
              <div className="video-details">
                <h2 className={themeClasses.text}>{selectedVideo.name}</h2>
                <p className={themeClasses.secondaryText}>{selectedVideo.description}</p>
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
