// Lightweight AI client + transformer for Wuta-Wuta
const API_URL = process.env.REACT_APP_AI_PROXY_URL || '/api/ai/generate';

async function callAiProxy(prompt) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI proxy error: ${res.status} ${txt}`);
    }

    return await res.json();
  } catch (err) {
    // Fail silently to allow fallback to a local mock
    console.warn('AI proxy call failed, using mock:', err.message);
    return {
      ...transformToEngineFormat(result),
      isMock: !remote
    };

  }
}

function mockAiResponse(prompt) {
  const text = `Generated from prompt: ${prompt}\nThis is a short description produced by the local mock.`;
  const title = (prompt || 'AI art').slice(0, 60);
  // tiny 1x1 PNG placeholder base64
  const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

  return {
    title,
    description: text,
    image_base64: imageBase64,
    prompt,
    attributes: [],
  };
}

function transformToEngineFormat(aiResult) {
  const title = aiResult.title || (aiResult.text || '').split('\n')[0] || 'Untitled AI Asset';
  const description = aiResult.description || aiResult.text || '';
  const imageBase64 = aiResult.image_base64 || aiResult.imageBase64 || null;

  return {
    engineVersion: 1,
    source: 'ai',
    title,
    description,
    imageBase64,
    prompt: aiResult.prompt || '',
    attributes: aiResult.attributes || [],
    createdAt: new Date().toISOString(),
  };
}

export async function sendPrompt(prompt) {
  const remote = await callAiProxy(prompt);
  const result = remote || mockAiResponse(prompt);
  return transformToEngineFormat(result);
}

export default { sendPrompt };
