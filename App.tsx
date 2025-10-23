import React, { useState, useCallback, useEffect } from 'react';
import { ClothingInfo, ImageFile, GeneratedImage } from './types';
import { generateTryOnImage, describeClothing, addAccessory } from './services/geminiService';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';

const poses = ['Pose Padrão', 'Mão na Cintura', 'Casual Cruzada', 'Perfil Pensativo'];

const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<ImageFile | null>(null);
  const [clothingImage, setClothingImage] = useState<ImageFile | null>(null);
  const [clothingInfo, setClothingInfo] = useState<ClothingInfo | null>(null);
  const [selectedPose, setSelectedPose] = useState<string>(poses[0]);
  const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDescribing, setIsDescribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'upload' | 'result'>('upload');

  useEffect(() => {
    setGeneratedImages({});
    setError(null);
  }, [personImage, clothingImage]);
  
  const resultData = generatedImages[selectedPose] ?? null;

  const handleClothingUpload = async (imageFile: ImageFile) => {
    setClothingImage(imageFile);
    setClothingInfo(null);
    setIsDescribing(true);
    try {
      const info = await describeClothing(imageFile);
      setClothingInfo(info);
    } catch (e) {
      console.error("Falha ao descrever a roupa:", e);
      setClothingInfo({ name: "Sua Nova Peça", description: "Uma peça incrível para o seu guarda-roupa.", occasions: "Perfeita para diversas ocasiões." });
    } finally {
        setIsDescribing(false);
    }
  }
  
  const generateImage = async (person: ImageFile, clothing: ImageFile, pose: string): Promise<GeneratedImage> => {
      const imageUrl = await generateTryOnImage(person, clothing, pose);
      return { url: imageUrl };
  }

  const handleGenerateClick = useCallback(async () => {
    if (!personImage || !clothingImage) {
      setError('Por favor, carregue a sua foto e a foto da roupa.');
      return;
    }

    setIsLoading(true);
    setViewMode('result');
    setError(null);
    const initialPose = poses[0];
    setSelectedPose(initialPose);
    setGeneratedImages({}); 

    try {
      const generatedData = await generateImage(personImage, clothingImage, initialPose);
      setGeneratedImages({ [initialPose]: generatedData });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro desconhecido.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [personImage, clothingImage]);
  
  const handleChangePose = useCallback(async (newPose: string) => {
    setSelectedPose(newPose);

    if (generatedImages[newPose] || !personImage || !clothingImage) {
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const generatedData = await generateImage(personImage, clothingImage, newPose);
      setGeneratedImages(prevImages => ({
        ...prevImages,
        [newPose]: generatedData
      }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro desconhecido.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [personImage, clothingImage, generatedImages]);

  const handleAddAccessory = useCallback(async (accessoryFile: ImageFile) => {
    if (!resultData?.url) return;

    setIsLoading(true);
    setError(null);
    try {
      const currentImageBase64 = resultData.url.split(',')[1];
      const newImageUrl = await addAccessory(currentImageBase64, accessoryFile);
      
      setGeneratedImages(prev => ({
        ...prev,
        [selectedPose]: { url: newImageUrl },
      }));
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Ocorreu um erro desconhecido ao adicionar acessório.');
        }
    } finally {
      setIsLoading(false);
    }
  }, [resultData, selectedPose]);

  const handleReturnToUpload = () => {
    setViewMode('upload');
  }
  
  const isButtonEnabled = !personImage || !clothingImage || isLoading || isDescribing;


  return (
    <div className="min-h-screen text-gray-800 flex flex-col font-sans relative isolate">
       <style>{`
        @keyframes shimmer-effect {
          0% { transform: translateX(-150%) skewX(-25deg); }
          100% { transform: translateX(150%) skewX(-25deg); }
        }
        .animate-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(110deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0) 60%);
          animation: shimmer-effect 3s infinite linear;
        }
      `}</style>
       <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
             <svg className="relative left-[calc(50%-11rem)] -z-10 h-[21.1875rem] max-w-none -translate-x-1/2 rotate-[30deg] sm:left-[calc(50%-30rem)] sm:h-[42.375rem]" viewBox="0 0 1155 678" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="url(#45de2b6b-92d5-4d6d-a682-a680b1ede1a1)" fillOpacity=".3" d="M317.219 518.975L203.852 678 0 438.341l317.219 80.634 204.172-286.402c1.307 132.337 45.083 346.658 209.733 145.248C936.936 126.058 882.053-94.234 1031.02 41.331c119.18 108.451 130.68 295.337 121.53 375.223L855 299l21.173 362.054-558.954-142.079z" />
                <defs>
                    <linearGradient id="45de2b6b-92d5-4d6d-a682-a680b1ede1a1" x1="1155.49" x2="-78.208" y1=".177" y2="474.645" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFD0B3" />
                    <stop offset="1" stopColor="#FFC19E" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
      <Header />
      <main className="flex-grow container mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        {viewMode === 'upload' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6 bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold text-center text-gray-800">Passo 1: Sua Foto</h2>
              <p className="text-center text-gray-500 -mt-4 mb-2">Para começar, precisamos de uma foto sua de corpo inteiro.</p>
              <div className="w-full max-w-md mx-auto">
                <ImageUploader
                  id="person-image"
                  title="Sua Foto (Corpo Inteiro)"
                  onImageUpload={setPersonImage}
                  imagePreview={personImage?.preview ?? null}
                  allowUrlUpload={false}
                />
              </div>
            </div>

            <div className="flex flex-col gap-6 bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold text-center text-gray-800">Passo 2: A Roupa</h2>
              <p className="text-center text-gray-500 -mt-4 mb-2">Agora, escolha a peça que deseja experimentar.</p>
              <div className="w-full max-w-md mx-auto">
                <ImageUploader
                  id="clothing-image"
                  title="Foto da Roupa"
                  onImageUpload={handleClothingUpload}
                  imagePreview={clothingImage?.preview ?? null}
                  allowUrlUpload={true}
                />
              </div>
            </div>

            <div className="lg:col-span-2 mt-4">
              <button
                onClick={handleGenerateClick}
                disabled={isButtonEnabled}
                className={`relative overflow-hidden w-full bg-gray-900 hover:bg-gray-700 text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg text-lg ${!isButtonEnabled ? 'animate-shimmer' : ''}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gerando seu look...
                  </>
                ) : isDescribing ? (
                     <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analisando a peça...
                    </>
                ) : (
                  '✨ Provar Roupa'
                )}
              </button>
            </div>
          </div>
        ) : (
           <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 shadow-sm relative">
                <button 
                    onClick={handleReturnToUpload}
                    className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                    </svg>
                    Trocar Imagens
                </button>
                <ResultDisplay
                    isLoading={isLoading}
                    resultImage={resultData?.url ?? null}
                    error={error}
                    personImagePreview={personImage?.preview ?? null}
                    poses={poses}
                    selectedPose={selectedPose}
                    handleChangePose={handleChangePose}
                    clothingInfo={clothingInfo}
                    onAddAccessory={handleAddAccessory}
                />
            </div>
        )}
      </main>
      <footer className="text-center text-gray-500 my-8 text-sm">
        <p>Desenvolvido com React, Tailwind CSS e Gemini API.</p>
      </footer>
    </div>
  );
};

export default App;