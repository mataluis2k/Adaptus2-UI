import React, { useState } from "react";
import { Video } from "./VideoGallery";

interface EditModalProps {
  video: Video | null;
  onClose: () => void;
  onSave: (videoData: Video) => void;
}

const EditModal: React.FC<EditModalProps> = ({ video, onClose, onSave }) => {
  const [formData, setFormData] = useState<Video>({
    id: video ? video.id : "",
    videoID: video ? video.videoID : "",
    name: video ? video.name : "",
    description: video ? video.description : "",
    source: video ? video.source : "local",
    filename: video ? video.filename : "",
    hero: video ? video.hero : "",
    heroUrl: video ? video.heroUrl : "",
    posterUrl: video ? video.posterUrl : "",
    mediaType: video ? video.mediaType : "video",
    labels: video ? video.labels : "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{video ? "Edit Video" : "New Video"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Video ID</label>
            <input
              type="text"
              name="videoID"
              value={formData.videoID}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Filename</label>
            <input
              type="text"
              name="filename"
              value={formData.filename}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Hero Image</label>
            <input
              type="text"
              name="hero"
              value={formData.hero}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Hero URL</label>
            <input
              type="text"
              name="heroUrl"
              value={formData.heroUrl}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Poster URL</label>
            <input
              type="text"
              name="posterUrl"
              value={formData.posterUrl}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Labels</label>
            <input
              type="text"
              name="labels"
              value={formData.labels}
              onChange={handleChange}
              required
            />
          </div>
          <div className="modal-buttons">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
