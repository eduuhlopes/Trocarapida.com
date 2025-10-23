import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { ClothingInfo, ImageFile } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = (imageFile: ImageFile) => {
  return {
    inlineData: {
      data: imageFile.base64,
      mimeType: imageFile.file.type,
    },
  };
};

const getPoseInstruction = (pose: string): string => {
    switch (pose) {
        case 'Mão na Cintura':
            return 'Altere a pose da pessoa para que ela fique em pé com uma mão na cintura, de forma natural e confiante. Mantenha a pessoa, o rosto, o cabelo e a roupa *exatamente* como na imagem original. A única alteração permitida é a pose corporal.';
        case 'Casual Cruzada':
            return 'Altere a pose da pessoa para que ela fique em pé com os braços levemente cruzados, em uma postura casual e descontraída. Mantenha a pessoa, o rosto, o cabelo e a roupa *exatamente* como na imagem original. A única alteração permitida é a pose corporal.';
        case 'Perfil Pensativo':
            return 'Altere a pose da pessoa para que ela fique de perfil, com a cabeça levemente inclinada para baixo em direção à câmera, uma mão na cintura e a outra no queixo. Mantenha a pessoa, o rosto, o cabelo e a roupa *exatamente* como na imagem original. A única alteração permitida é a pose corporal.';
        case 'Pose Padrão':
        default:
            return 'Altere a pose da pessoa para que ela fique em pé com os braços para baixo ao lado do corpo, em uma pose de descanso natural. Mantenha a pessoa, o rosto, o cabelo e a roupa *exatamente* como na imagem original. A única alteração permitida é a pose corporal.';
    }
}

export const generateTryOnImage = async (
  personImage: ImageFile,
  clothingImage: ImageFile,
  pose: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-image';
    
    const poseInstruction = getPoseInstruction(pose);

    const prompt = `Sua tarefa é um provador virtual. Pegue a peça de roupa da segunda imagem e coloque-a na pessoa da primeira imagem.
1.  **Fidelidade da Roupa:** É crucial que a peça de roupa (incluindo cor, estampa, textura e todos os detalhes) na imagem final seja *exatamente idêntica* à da imagem de entrada. Não altere o design da roupa de forma alguma.
2.  **Realismo:** A roupa deve se ajustar de forma realista ao corpo da pessoa.
3.  **Pose:** ${poseInstruction} A roupa deve se ajustar perfeitamente à nova pose.
4.  **Fundo:** O fundo da imagem resultante DEVE ser totalmente branco e neutro (#FFFFFF).
5.  **Qualidade:** O resultado deve ser uma única imagem fotorealista, sem nenhum texto ou explicação.`;

    const personImagePart = fileToGenerativePart(personImage);
    const clothingImagePart = fileToGenerativePart(clothingImage);
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [personImagePart, clothingImagePart, { text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const parts = response?.candidates?.[0]?.content?.parts;

    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    const blockReason = response?.promptFeedback?.blockReason;
    if (blockReason) {
      throw new Error(`A geração da imagem foi bloqueada por: ${blockReason}. Tente usar outras imagens.`);
    }

    throw new Error("A API não retornou uma imagem. A resposta pode estar vazia ou ter sido bloqueada.");
  } catch (error) {
    console.error("Erro ao gerar imagem com a API Gemini:", error);
     if (error instanceof Error) {
        throw new Error(`Não foi possível gerar a imagem. ${error.message}`);
      }
    throw new Error("Não foi possível gerar a imagem. Por favor, tente novamente com outras fotos.");
  }
};


export const describeClothing = async (clothingImage: ImageFile): Promise<ClothingInfo> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = 'Analise a imagem desta peça de roupa. Retorne um objeto JSON com três chaves: "name" (o nome ou tipo da peça, ex: "Vestido Azul Midi com Babados"), "description" (uma descrição curta e atrativa da peça), e "occasions" (um texto breve sugerindo onde usá-la).';
    
    const imagePart = fileToGenerativePart(clothingImage);

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            occasions: { type: Type.STRING },
          },
          required: ["name", "description", "occasions"],
        },
      },
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString) as ClothingInfo;

  } catch (error) {
    console.error("Erro ao descrever a roupa:", error);
    return {
      name: "Peça de Roupa",
      description: "Uma peça incrível para compor seu look.",
      occasions: "Perfeita para diversas ocasiões especiais.",
    };
  }
};

export const addAccessory = async (
  currentImageBase64: string,
  accessoryImage: ImageFile
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-image';
    const prompt = `Esta é uma tarefa de edição de imagem. Pegue a pessoa na primeira imagem e adicione o acessório da segunda imagem nela de forma realista. O fundo deve permanecer branco. Mantenha a pessoa e a roupa original intactas, apenas adicionando o acessório.`;

    const currentImagePart = {
      inlineData: {
        data: currentImageBase64,
        mimeType: 'image/png',
      },
    };
    const accessoryImagePart = fileToGenerativePart(accessoryImage);

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [currentImagePart, accessoryImagePart, { text: prompt }] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const parts = response?.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("A API não retornou uma imagem editada.");
  } catch (error) {
    console.error("Erro ao adicionar acessório:", error);
    throw new Error("Não foi possível adicionar o acessório. Tente novamente.");
  }
};

export const getStylistAdvice = async (
  imageBase64: string,
  userPrompt: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Você é um estilista de moda amigável e prestativo, chamado TrocaRápida AI. Com base na imagem de uma pessoa usando uma roupa, responda à seguinte pergunta do usuário. Seja conciso, encorajador e dê conselhos práticos de moda.

Pergunta do usuário: "${userPrompt}"`;
    
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/png',
      },
    };

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
    });

    return response.text.trim();

  } catch (error) {
    console.error("Erro ao obter conselho do estilista:", error);
    throw new Error("Não foi possível obter uma resposta do estilista. Tente novamente.");
  }
};
