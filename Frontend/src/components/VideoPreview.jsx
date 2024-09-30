import React from 'react';

const VideoPreview = ({ videoUrl, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-3xl w-full">
        <video src={videoUrl} controls className="w-full mb-4" />
        <button
          onClick={onClose}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Close Preview
        </button>
      </div>
    </div>
  );
};

export default VideoPreview;