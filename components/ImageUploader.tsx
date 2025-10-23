import React, { useCallback, useRef, useState } from 'react';
import type { ImageFile } from '../types';

interface ImageUploaderProps {
  id: string;
  title: string;
  onImageUpload: (file: ImageFile) => void;
  imagePreview: string | null;
  allowUrlUpload?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, title, onImageUpload, imagePreview, allowUrlUpload = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [url, setUrl] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [onImageUpload]);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      onImageUpload({
        file,
        preview: URL.createObjectURL(file),
        base64: base64String,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAreaClick = () => {
    if (uploadMode === 'file') {
      inputRef.current?.click();
    }
  };

  const handleUrlLoad = async () => {
    if (!url) {
      setErrorUrl('Por favor, insira uma URL válida.');
      return;
    }
    setIsLoadingUrl(true);
    setErrorUrl(null);

    try {
       // This is a simplified client-side fetch. For production, a CORS proxy server would be more robust.
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Não foi possível buscar a imagem. Verifique a URL e as permissões de CORS.');
      }
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        throw new Error('A URL não aponta para uma imagem válida.');
      }
      const fileName = url.substring(url.lastIndexOf('/') + 1) || 'image.jpg';
      const file = new File([blob], fileName, { type: blob.type });
      processFile(file);
    } catch (e: any) {
      setErrorUrl(e.message || 'Ocorreu um erro ao carregar a imagem da URL.');
    } finally {
      setIsLoadingUrl(false);
    }
  };


  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-semibold mb-2 text-gray-600">{title}</h3>
      {allowUrlUpload && (
        <div className="w-full max-w-xs mx-auto mb-4">
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setUploadMode('file')}
              className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${uploadMode === 'file' ? 'bg-white shadow' : 'text-gray-600'}`}
            >
              Arquivo
            </button>
            <button
              onClick={() => setUploadMode('url')}
              className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${uploadMode === 'url' ? 'bg-white shadow' : 'text-gray-600'}`}
            >
              URL
            </button>
          </div>
        </div>
      )}
      {uploadMode === 'file' ? (
        <div
          onClick={handleAreaClick}
          className="w-full aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-500 hover:bg-gray-100 transition-all duration-300 overflow-hidden"
        >
          <input
            type="file"
            id={id}
            ref={inputRef}
            accept="image/png, image/jpeg"
            onChange={handleFileChange}
            className="hidden"
          />
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-gray-400 p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-sm">Clique para carregar</p>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full flex flex-col gap-2">
            <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
                onClick={handleUrlLoad}
                disabled={isLoadingUrl}
                className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors flex items-center justify-center"
            >
                {isLoadingUrl ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                ) : (
                    "Carregar da URL"
                )}
            </button>
            {errorUrl && <p className="text-sm text-red-600 text-center">{errorUrl}</p>}
             <div className="w-full aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mt-2">
                {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <p className="text-gray-400 text-sm">Preview da imagem</p>
                )}
             </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;