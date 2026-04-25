import React, { useState } from 'react';
import { sendPrompt } from '../ai/wutaAi';

const AiPrompt = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await sendPrompt(prompt.trim());
      setResult(res);
    } catch (err) {
      console.error(err);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">AI Prompt</h2>

      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Describe the art you want to generate..."
          className="w-full p-3 border rounded"
        />

        <div className="mt-3">
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded"
            disabled={loading}
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6 p-4 border rounded bg-white">
          {result.error && <div className="text-red-600">{result.error}</div>}
          {!result.error && (
            <>
              <h3 className="text-xl font-medium">{result.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{result.description}</p>
              const imgSrc = getImageSrc(result);

              {imgSrc && (
                <img
                  src={imgSrc}
                  alt={result.title}
                  className="max-w-full h-auto mb-3"
                />
              )}

              <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(result, null, 2)}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AiPrompt;
