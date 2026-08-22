import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  RotateCw, 
  FileText 
} from 'lucide-react';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// FIX: Explicit https:// protocol prevents worker load failures in strict environments
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ResumeViewerModal = ({ isOpen, onClose, resumeUrl, resumeName }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const updateWidth = () => {
      if (containerRef.current) {
        const padding = window.innerWidth < 640 ? 20 : window.innerWidth < 1024 ? 40 : 64;
        const availableWidth = containerRef.current.clientWidth - padding;
        setContainerWidth(availableWidth > 280 ? availableWidth : 300);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [isOpen]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') setPageNumber((prev) => Math.max(prev - 1, 1));
    if (e.key === 'ArrowRight') setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
    if (e.key === '+' || e.key === '=') setScale((prev) => Math.min(prev + 0.2, 2.5));
    if (e.key === '-') setScale((prev) => Math.max(prev - 0.2, 0.5));
  }, [isOpen, onClose, numPages]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !resumeUrl) return null;

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const prevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const nextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages || 1));

  const getPageWidth = () => {
    if (window.innerWidth >= 1280) {
      return Math.min(containerWidth, 820);
    } else if (window.innerWidth >= 1024) {
      return Math.min(containerWidth, 760);
    } else if (window.innerWidth >= 768) {
      return Math.min(containerWidth, 640);
    }
    return Math.min(containerWidth, 460);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#040d14]/92 backdrop-blur-md flex justify-center items-center p-2 sm:p-4 md:p-6 animate-fadeInSmooth overflow-y-auto">
      <div className="w-[98vw] sm:w-[92vw] md:w-[88vw] lg:w-[980px] xl:w-[1060px] bg-[#081b29] border border-cyan-500/40 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,238,255,0.22)] flex flex-col h-fit max-h-[88vh] my-auto overflow-hidden">
        
        <header className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3.5 bg-[#0a2336] border-b border-cyan-500/30 select-none shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="overflow-hidden">
              <h3 className="text-white font-bold text-xs sm:text-base truncate">
                {resumeName || 'Applicant_Resume.pdf'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-cyan-400/80 font-medium truncate">
                {numPages ? `Total ${numPages} ${numPages === 1 ? 'Page' : 'Pages'}` : 'PDF Document Viewer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="flex items-center bg-[#06141f] border border-cyan-500/30 rounded-xl overflow-hidden text-xs">
              <button 
                onClick={handleZoomOut} 
                className="p-1.5 sm:p-2 text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <span className="px-1.5 sm:px-2 font-mono font-bold text-cyan-400 select-none min-w-[42px] sm:min-w-[52px] text-center text-[11px] sm:text-xs">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={handleZoomIn} 
                className="p-1.5 sm:p-2 text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <div className="w-px h-4 sm:h-5 bg-cyan-500/20"></div>
              <button 
                onClick={handleRotate} 
                className="p-1.5 sm:p-2 text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            <a
              href={resumeUrl}
              download={resumeName || 'Resume.pdf'}
              className="flex items-center gap-1.5 bg-cyan-400 text-[#081b29] font-bold px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm hover:bg-orange-400 shadow-neon hover:scale-105 transition-all"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Download</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 border border-transparent rounded-xl transition-all"
              title="Close (ESC)"
            >
              <X className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </header>

        <div 
          ref={containerRef}
          className="overflow-auto flex justify-center items-start p-4 sm:p-6 md:p-8 bg-[#05111a] custom-scrollbar select-none min-h-[220px]"
        >
          <Document
            file={resumeUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center my-16 sm:my-24 text-cyan-400">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                  <FileText className="absolute text-cyan-400/60 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-xs sm:text-sm font-semibold tracking-wide text-gray-300">
                  Rendering Document...
                </p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center my-16 sm:my-20 p-5 sm:p-6 max-w-md text-center bg-[#0a2336] border border-red-500/30 rounded-2xl mx-4">
                <p className="text-red-400 font-semibold text-xs sm:text-sm mb-2">
                  Failed to load PDF preview
                </p>
                <p className="text-gray-400 text-[11px] sm:text-xs mb-4">
                  Your browser might restrict embedded data URLs. Please download the file directly.
                </p>
                <a
                  href={resumeUrl}
                  download={resumeName || 'Resume.pdf'}
                  className="bg-cyan-400 text-[#081b29] font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Download PDF Now
                </a>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              width={getPageWidth()}
              className="shadow-[0_10px_35px_rgba(0,0,0,0.75)] rounded-lg sm:rounded-xl overflow-hidden border border-cyan-500/30 transition-all duration-200 my-auto mx-auto shrink-0"
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>

        {numPages && numPages > 1 && (
          <footer className="flex justify-between sm:justify-center items-center gap-2 sm:gap-4 px-4 py-2.5 sm:px-6 sm:py-3 bg-[#0a2336] border-t border-cyan-500/20 text-xs sm:text-sm select-none shrink-0">
            <button
              onClick={prevPage}
              disabled={pageNumber <= 1}
              className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-1.5 bg-[#06141f] border border-cyan-500/30 rounded-xl text-cyan-400 font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-500/20 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> <span>Previous</span>
            </button>

            <span className="font-mono text-gray-300 px-2.5 py-1 sm:px-3 sm:py-1 bg-[#06141f] border border-cyan-500/20 rounded-lg text-[11px] sm:text-xs">
              Page <strong className="text-cyan-400">{pageNumber}</strong> of <strong>{numPages}</strong>
            </span>

            <button
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-1.5 bg-[#06141f] border border-cyan-500/30 rounded-xl text-cyan-400 font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-500/20 transition-all"
            >
              <span>Next</span> <ChevronRight className="w-4 h-4" />
            </button>
          </footer>
        )}

      </div>
    </div>,
    document.body
  );
};

export default ResumeViewerModal;