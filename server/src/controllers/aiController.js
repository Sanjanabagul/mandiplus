import { generateProcurementAdvice } from '../services/aiProcurementService.js';
import { assessProduceQuality } from '../services/produceGradingService.js';
import { Conversation } from '../models/Conversation.js';

export const chatProcurement = async (req, res, next) => {
  try {
    const { message, language = 'en', conversationId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.'
      });
    }

    const userLocality = req.user?.locality || '';
    const { reply, recommendations, parsedItems } = await generateProcurementAdvice({
      message,
      language,
      userLocality
    });

    let currentConversationId = conversationId;

    // Persist conversation if user is logged in
    if (req.user) {
      let conv;
      if (conversationId) {
        conv = await Conversation.findOne({ _id: conversationId, user: req.user._id });
      }

      if (!conv) {
        conv = await Conversation.create({
          user: req.user._id,
          title: message.slice(0, 40) + '...',
          language,
          messages: []
        });
        currentConversationId = conv._id;
      }

      conv.messages.push({
        role: 'user',
        content: message,
        language
      });

      conv.messages.push({
        role: 'assistant',
        content: reply,
        language,
        recommendations
      });

      await conv.save();
    }

    return res.status(200).json({
      success: true,
      conversationId: currentConversationId,
      reply,
      recommendations,
      parsedItems
    });
  } catch (err) {
    next(err);
  }
};

export const getConversationHistory = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      conversations
    });
  } catch (err) {
    next(err);
  }
};

export const gradeProduceImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file of the produce.'
      });
    }

    const { cropName } = req.body;
    const gradingResult = await assessProduceQuality({
      imagePath: req.file.path,
      cropName: cropName || 'Produce'
    });

    return res.status(200).json({
      success: true,
      imageUrl: `/uploads/${req.file.filename}`,
      grading: gradingResult
    });
  } catch (err) {
    next(err);
  }
};
