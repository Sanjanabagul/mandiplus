import api from './api.js';

export const aiService = {
  chatProcurement: async (message, language = 'en', conversationId = null) => {
    const res = await api.post('/ai/procurement/chat', { message, language, conversationId });
    return res.data;
  },

  getConversationHistory: async () => {
    const res = await api.get('/ai/procurement/history');
    return res.data;
  },

  gradeProduceImage: async (formData) => {
    const res = await api.post('/ai/produce-grading', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  }
};
