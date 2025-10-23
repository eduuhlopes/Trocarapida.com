import React from 'react';

// FIX: Switched from import.meta.env.VITE_API_KEY to process.env.API_KEY to comply with Gemini API guidelines and resolve the TypeScript error.
const API_KEY = process.env.API_KEY;

interface ApiKeyGuardProps {
  children: React.ReactNode;
}

const ApiKeyGuard: React.FC<ApiKeyGuardProps> = ({ children }) => {
  if (!API_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-800 p-4 sm:p-8">
        <div className="text-center max-w-2xl bg-white rounded-2xl shadow-2xl p-6 sm:p-10 border-2 border-red-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="mt-4 text-3xl font-extrabold text-red-900">Erro de Configuração</h1>
          {/* FIX: Updated all references from VITE_API_KEY to API_KEY in user-facing instructions to align with guideline changes. */}
          <p className="mt-4 text-lg">
            A chave da API do Google Gemini (API_KEY) não foi encontrada.
          </p>
          <p className="mt-2 text-md">
            Para que o aplicativo funcione corretamente, você precisa configurar a variável de ambiente <code className="bg-red-200 text-red-900 font-mono p-1 rounded-md">API_KEY</code> nas configurações do seu projeto na Vercel.
          </p>
          <div className="mt-6 text-left bg-gray-50 p-4 rounded-lg border border-red-200">
            <h2 className="font-bold text-lg text-gray-800">Como resolver:</h2>
            <ol className="list-decimal list-inside mt-2 space-y-2 text-gray-700">
              <li>Acesse o painel do seu projeto na Vercel.</li>
              <li>Vá para a aba <strong>Settings</strong> e depois <strong>Environment Variables</strong>.</li>
              <li>Adicione (ou renomeie) uma variável com o nome <code className="bg-red-200 text-red-900 font-mono p-1 rounded-md">API_KEY</code>.</li>
              <li>Cole o valor da sua chave da API do Google AI Studio no campo de valor.</li>
              <li>Salve e faça um novo "redeploy" da sua aplicação (em Deploys, selecione o último e clique em "Redeploy").</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ApiKeyGuard;
