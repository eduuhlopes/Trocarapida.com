import React, { useRef, useCallback, useState, useEffect } from 'react';
import type { ClothingInfo, ImageFile } from '../types';

interface ResultDisplayProps {
  isLoading: boolean;
  resultImage: string | null;
  error: string | null;
  personImagePreview: string | null;
  poses: string[];
  selectedPose: string;
  clothingInfo: ClothingInfo | null;
  handleChangePose: (pose: string) => void;
  onAddAccessory: (file: ImageFile) => void;
}

interface LoupeState {
  visible: boolean;
  mouseX: number; // Position of the loupe element relative to container
  mouseY: number;
  bgX: number; // Position of cursor relative to image for background-position
  bgY: number;
}

const LoadingOverlay: React.FC<{ personImagePreview: string | null, isLoading: boolean }> = ({ personImagePreview, isLoading }) => {
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (isLoading) {
            setProgress(0);
            setIsComplete(false);
            let currentProgress = 0;
            const interval = setInterval(() => {
                if (currentProgress < 95) {
                    currentProgress += Math.random() * 5 + 1;
                    setProgress(Math.min(Math.floor(currentProgress), 95));
                }
            }, 200);
            return () => clearInterval(interval);
        } else {
            // When loading finishes, jump to 100%
            setProgress(100);
            setTimeout(() => setIsComplete(true), 500); // Wait for the 100% to be visible before fading out
        }
    }, [isLoading]);

    return (
        <div className={`
            absolute inset-0 z-50 flex items-center justify-center transition-all duration-700 ease-in-out
            ${isComplete ? 'opacity-0' : 'opacity-100'}
            animate-slide-down
        `}>
            {personImagePreview && (
                <img src={personImagePreview} alt="Loading background" className="absolute top-0 left-0 w-full h-full object-cover rounded-lg filter blur-lg scale-105" />
            )}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-md"></div>
            <div className="relative text-center text-gray-800 drop-shadow-lg">
                <p className="text-7xl font-bold font-sans tracking-tighter">{progress}%</p>
                <p className="text-lg mt-2">Gerando seu look...</p>
            </div>
            <style>{`
                @keyframes slide-down {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-down {
                    animation: slide-down 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                }
            `}</style>
        </div>
    );
};


const ResultDisplay: React.FC<ResultDisplayProps> = ({ isLoading, resultImage, error, personImagePreview, poses, selectedPose, clothingInfo, handleChangePose, onAddAccessory }) => {
  const accessoryInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [loupe, setLoupe] = useState<LoupeState | null>(null);

  const handleAccessoryButtonClick = () => {
    accessoryInputRef.current?.click();
  };

  const handleAccessoryFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        onAddAccessory({
          file,
          preview: URL.createObjectURL(file),
          base64: base64String,
        });
      };
      reader.readAsDataURL(file);
    }
  }, [onAddAccessory]);

  const handleMouseMoveOnImage = (event: React.MouseEvent<HTMLDivElement>) => {
    const imageEl = imageRef.current;
    if (!imageEl) return;

    const containerRect = event.currentTarget.getBoundingClientRect();
    const imageRect = imageEl.getBoundingClientRect();

    // Cursor position relative to the container div
    const containerMouseX = event.clientX - containerRect.left;
    const containerMouseY = event.clientY - containerRect.top;

    // Calculate image offsets within the container (handles 'object-contain')
    const imageOffsetX = imageRect.left - containerRect.left;
    const imageOffsetY = imageRect.top - containerRect.top;

    // Cursor position relative to the actual image's top-left corner
    const imageMouseX = containerMouseX - imageOffsetX;
    const imageMouseY = containerMouseY - imageOffsetY;

    // Check if cursor is within the actual image bounds
    if (
      imageMouseX >= 0 &&
      imageMouseX <= imageRect.width &&
      imageMouseY >= 0 &&
      imageMouseY <= imageRect.height
    ) {
      setLoupe({
        visible: true,
        mouseX: containerMouseX, // Position the loupe element relative to the container
        mouseY: containerMouseY,
        bgX: imageMouseX, // Use image-relative coords for background-position
        bgY: imageMouseY,
      });
    } else {
      // Hide if cursor is in the container's empty space but not on the image
      if (loupe?.visible) {
        handleMouseLeaveImage();
      }
    }
  };

  const handleMouseLeaveImage = () => {
    if (loupe) {
        setLoupe({ ...loupe, visible: false });
    }
  };


  if (isLoading && !resultImage) {
    return <LoadingOverlay personImagePreview={personImagePreview} isLoading={true} />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-red-600 p-4 min-h-[500px]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-xl font-semibold mt-4">Ocorreu um Erro</h3>
        <p className="mt-2 bg-red-100 text-red-800 p-3 rounded-md">{error}</p>
      </div>
    );
  }

  if (resultImage) {
    const LOUPE_SIZE = 150;
    const ZOOM_LEVEL = 2;

    const imageRenderedWidth = imageRef.current?.width ?? 0;
    const imageRenderedHeight = imageRef.current?.height ?? 0;

    return (
      <div className="w-full h-full animate-fade-in pt-12 relative">
        {isLoading && <LoadingOverlay personImagePreview={personImagePreview} isLoading={true} />}
        
        {/* Hidden file inputs */}
        <input type="file" ref={accessoryInputRef} onChange={handleAccessoryFileChange} accept="image/png, image/jpeg" className="hidden" />
        
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
        `}</style>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* --- Coluna Esquerda --- */}
            <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-800">{clothingInfo?.name || "Sua Nova Peça"}</h2>
                    <p className="text-gray-600 mt-2">{clothingInfo?.description || "Uma peça incrível para compor seu look."}</p>
                    <div className="mt-4">
                        <h4 className="font-semibold text-gray-700">Sugestão de Uso:</h4>
                        <p className="text-sm text-gray-500">{clothingInfo?.occasions || "Perfeita para diversas ocasiões especiais."}</p>
                    </div>
                </div>

                <div className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-md font-semibold mb-3 text-center text-gray-700">Gostou? Tente outra pose!</h4>
                    <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
                        {poses.map((pose) => (
                            <button
                                key={pose}
                                onClick={() => handleChangePose(pose)}
                                disabled={selectedPose === pose && !isLoading}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 disabled:cursor-not-allowed ${
                                    selectedPose === pose && !isLoading
                                    ? 'bg-gray-800 border-gray-800 text-white shadow-md'
                                    : 'bg-white border-gray-300 hover:bg-gray-200 hover:border-gray-400 disabled:opacity-50'
                                }`}
                            >
                                {pose}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-md font-semibold mb-3 text-center text-gray-700">Dê um toque final!</h4>
                    <button
                        onClick={handleAccessoryButtonClick}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Adicionar Acessório
                    </button>
                </div>

                <a 
                href={resultImage} 
                download="resultado_provador_virtual.png"
                className="w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 ease-in-out shadow-lg"
                >
                Baixar Imagem
                </a>
            </div>

            {/* --- Coluna Direita --- */}
            <div className="lg:col-span-2">
                <h3 className="text-3xl font-bold text-center text-gray-800 mb-4">Seu Novo Look!</h3>
                <div 
                    onMouseMove={handleMouseMoveOnImage}
                    onMouseLeave={handleMouseLeaveImage}
                    className="relative w-full aspect-[3/4] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden cursor-none"
                >
                    {isLoading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-40">
                        <svg className="animate-spin h-8 w-8 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    )}
                    <img 
                        ref={imageRef}
                        src={resultImage} 
                        alt="Resultado do Provador Virtual" 
                        className="w-full h-full object-contain"
                    />
                    {loupe?.visible && (
                        <div
                            className="absolute pointer-events-none rounded-full border-4 border-white bg-no-repeat shadow-2xl"
                            style={{
                                left: loupe.mouseX - LOUPE_SIZE / 2,
                                top: loupe.mouseY - LOUPE_SIZE / 2,
                                width: LOUPE_SIZE,
                                height: LOUPE_SIZE,
                                backgroundImage: `url(${resultImage})`,
                                backgroundSize: `${imageRenderedWidth * ZOOM_LEVEL}px ${imageRenderedHeight * ZOOM_LEVEL}px`,
                                backgroundPosition: `-${loupe.bgX * ZOOM_LEVEL - LOUPE_SIZE / 2}px -${loupe.bgY * ZOOM_LEVEL - LOUPE_SIZE / 2}px`,
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 text-gray-400 min-h-[500px]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="text-xl font-semibold mt-4 text-gray-500">Seu resultado aparecerá aqui</h3>
        <p className="text-gray-400 mt-2">Carregue suas imagens e clique em "Provar Roupa" para começar.</p>
    </div>
  );
};

export default ResultDisplay;