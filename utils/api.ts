
export const API_URL = '/api';

export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
  const token = localStorage.getItem('token');
  const headers: any = {};

  // Only set Content-Type to JSON if body is NOT FormData
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });

    // Check if response is JSON
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'API Request Failed');
      }
      return data;
    } else {
      // If not JSON, it's likely an HTML error page (404, 500, etc.)
      const text = await res.text();
      console.error('Non-JSON Response:', text);
      throw new Error(`Server Error: ${res.status} ${res.statusText}. Please check the console for details.`);
    }
  } catch (error: any) {
    console.error('API Error:', error);
    throw error;
  }
};
