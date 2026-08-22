import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X } from 'lucide-react';
import { getCroppedImg } from '../../utils/cropImage';

const ImageCropModal = ({ imageSrc, onComplete, onClose }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 px-4">
      <div className="bg-[#081b29] p-6 rounded-2xl border border-cyan-500/50 w-full max-w-sm relative shadow-neon">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-cyan-400 z-10 transition-colors">
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Adjust Profile Picture</h3>
        
        <div className="relative w-full h-64 bg-[#0a2336] rounded-lg overflow-hidden mb-4 border border-cyan-500/30">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="flex gap-4 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-transparent border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2 bg-cyan-400 text-[#081b29] font-bold rounded-lg hover:bg-orange-400 transition-colors shadow-neon">Apply Image</button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;