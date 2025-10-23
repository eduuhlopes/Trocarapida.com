import React, { useRef, useCallback, useState, useEffect } from 'react';
import type { ClothingInfo, ImageFile, ChatMessage } from '../types';
import { getStylistAdvice } from '../services/geminiService';
import VirtualStylist from './VirtualStylist';
import BeforeAfterSlider from './BeforeAfterSlider';

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
  mouseX: number;
  mouseY: number;
  bgX: number;
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
            setProgress(100);
            setTimeout(() => setIsComplete(true), 500);
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
  
  const [isStylistOpen, setIsStylistOpen] = useState(false);
  const [stylistMessages, setStylistMessages] = useState<ChatMessage[]>([]);
  const [isStylistLoading, setIsStylistLoading] = useState(false);
  const [isCompareView, setIsCompareView] = useState(false);
  const [loupe, setLoupe] = useState<LoupeState | null>(null);

  useEffect(() => {
    if(resultImage && stylistMessages.length === 0) {
      setStylistMessages([
        { role: 'model', content: 'Olá! Adorei o seu novo look. Como posso te ajudar a estilizá-lo ainda mais?' }
      ]);
    }
  }, [resultImage, stylistMessages.length]);

  const handleSendMessageToStylist = async (message: string) => {
    if (!resultImage) return;

    const newMessages: ChatMessage[] = [...stylistMessages, { role: 'user', content: message }];
    setStylistMessages(newMessages);
    setIsStylistLoading(true);

    try {
      const imageBase64 = resultImage.split(',')[1];
      const response = await getStylistAdvice(imageBase64, message);
      setStylistMessages([...newMessages, { role: 'model', content: response }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro.';
      setStylistMessages([...newMessages, { role: 'model', content: `Desculpe, não consegui processar sua solicitação. ${errorMessage}` }]);
    } finally {
      setIsStylistLoading(false);
    }
  };

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
    if (isCompareView) return;
    const imageEl = imageRef.current;
    if (!imageEl) return;
    const containerRect = event.currentTarget.getBoundingClientRect();
    const imageRect = imageEl.getBoundingClientRect();
    const imageOffsetX = imageRect.left - containerRect.left;
    const imageOffsetY = imageRect.top - containerRect.top;
    const containerMouseX = event.clientX - containerRect.left;
    const containerMouseY = event.clientY - containerRect.top;
    const imageMouseX = containerMouseX - imageOffsetX;
    const imageMouseY = containerMouseY - imageOffsetY;
    if (imageMouseX >= 0 && imageMouseX <= imageRect.width && imageMouseY >= 0 && imageMouseY <= imageRect.height) {
      setLoupe({ visible: true, mouseX: containerMouseX, mouseY: containerMouseY, bgX: imageMouseX, bgY: imageMouseY });
    } else {
      if (loupe?.visible) { handleMouseLeaveImage(); }
    }
  };

  const handleMouseLeaveImage = () => {
    if (loupe) { setLoupe({ ...loupe, visible: false }); }
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
        <input type="file" ref={accessoryInputRef} onChange={handleAccessoryFileChange} accept="image/png, image/jpeg" className="hidden" />
        
        <VirtualStylist 
          isOpen={isStylistOpen}
          onClose={() => setIsStylistOpen(false)}
          messages={stylistMessages}
          onSendMessage={handleSendMessageToStylist}
          isLoading={isStylistLoading}
        />
        
        <style>{`
          @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        `}</style>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-800">{clothingInfo?.name || "Sua Nova Peça"}</h2>
                    <p className="text-gray-600 mt-2">{clothingInfo?.description || "Uma peça incrível para compor seu look."}</p>
                    <div className="mt-4"><h4 className="font-semibold text-gray-700">Sugestão de Uso:</h4><p className="text-sm text-gray-500">{clothingInfo?.occasions || "Perfeita para diversas ocasiões especiais."}</p></div>
                </div>

                <div className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-md font-semibold mb-3 text-center text-gray-700">Gostou? Tente outra pose!</h4>
                    <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">{poses.map((pose) => (<button key={pose} onClick={() => handleChangePose(pose)} disabled={selectedPose === pose && !isLoading} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 disabled:cursor-not-allowed ${selectedPose === pose && !isLoading ? 'bg-gray-800 border-gray-800 text-white shadow-md' : 'bg-white border-gray-300 hover:bg-gray-200 hover:border-gray-400 disabled:opacity-50'}`}>{pose}</button>))}</div>
                </div>
                
                <div className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-md font-semibold mb-3 text-center text-gray-700">Ferramentas de Estilo</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleAccessoryButtonClick} disabled={isLoading} className="flex flex-col items-center gap-1 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-gray-700"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg><span className="text-xs font-semibold">Acessório</span></button>
                        <button onClick={() => setIsStylistOpen(true)} disabled={isLoading} className="flex flex-col items-center gap-1 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-gray-700"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.53-.388M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg><span className="text-xs font-semibold">Estilista</span></button>
                        <button onClick={() => setIsCompareView(!isCompareView)} disabled={isLoading} className="flex flex-col items-center gap-1 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-gray-700"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.792V6.375a2.25 2.25 0 00-2.25-2.25h-5.379a2.25 2.25 0 00-1.591.659l-4.5 4.5a2.25 2.25 0 000 3.182l4.5 4.5a2.25 2.25 0 001.591.659h5.379a2.25 2.25 0 002.25-2.25z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg><span className="text-xs font-semibold">{isCompareView ? 'Ver Resultado' : 'Comparar'}</span></button>
                        <a href={resultImage} download="trocarapida_look.png" className="flex flex-col items-center gap-1 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg><span className="text-xs font-semibold">Baixar</span></a>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                <h3 className="text-3xl font-bold text-center text-gray-800 mb-4">Seu Novo Look!</h3>
                {isCompareView && personImagePreview ? (
                     <BeforeAfterSlider beforeImage={personImagePreview} afterImage={resultImage} />
                ) : (
                    <div onMouseMove={handleMouseMoveOnImage} onMouseLeave={handleMouseLeaveImage} className="relative w-full aspect-[3/4] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden cursor-none">
                        <div className={`absolute inset-0 bg-white/80 flex items-center justify-center z-40 transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <svg className="animate-spin h-8 w-8 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        </div>
                        <img ref={imageRef} src={resultImage} alt="Resultado do Provador Virtual" className={`w-full h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}/>
                        {loupe?.visible && (<div className="absolute pointer-events-none rounded-full border-4 border-white bg-no-repeat shadow-2xl" style={{ left: loupe.mouseX - LOUPE_SIZE / 2, top: loupe.mouseY - LOUPE_SIZE / 2, width: LOUPE_SIZE, height: LOUPE_SIZE, backgroundImage: `url(${resultImage})`, backgroundSize: `${imageRenderedWidth * ZOOM_LEVEL}px ${imageRenderedHeight * ZOOM_LEVEL}px`, backgroundPosition: `-${loupe.bgX * ZOOM_LEVEL - LOUPE_SIZE / 2}px -${loupe.bgY * ZOOM_LEVEL - LOUPE_SIZE / 2}px`, }}/>)}
                    </div>
                )}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 text-gray-400 min-h-[500px]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        <h3 className="text-xl font-semibold mt-4 text-gray-500">Seu resultado aparecerá aqui</h3>
        <p className="text-gray-400 mt-2">Carregue suas imagens e clique em "Provar Roupa" para começar.</p>
    </div>
  );
};

export default ResultDisplay;
