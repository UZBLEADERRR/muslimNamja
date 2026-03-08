const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Verifies a payment screenshot using Gemini AI
 * @param {Buffer} imageBuffer - Required image data
 * @param {string} mimeType - The mimeType of the image (e.g., 'image/png', 'image/jpeg')
 * @returns {Object} - { isPayment: boolean, amount: number, isVerified: boolean }
 */
async function verifyPaymentScreenshot(imageBuffer, mimeType) {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
        throw new Error('AI_API_KEY is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the latest flash model for vision
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
    Analyze this image and determine if it is a valid bank transfer or payment receipt.
    Respond ONLY with a JSON object in this exact format, with no extra text or markdown:
    {
      "isPayment": true/false, // Is this a receipt?
      "amount": number, // What is the amount transferred? Return 0 if not found.
      "isVerified": true/false // Does this look like a successful and completed transfer?
    }
  `;

    const imageParts = [
        {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType
            }
        }
    ];

    try {
        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        let text = response.text().trim();

        // Clean up potential markdown blocks
        if (text.startsWith('\`\`\`json')) {
            text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        }

        const parsedData = JSON.parse(text);
        return parsedData;
    } catch (error) {
        console.error('AI Verification Error:', error);
        return {
            isPayment: false,
            amount: 0,
            isVerified: false,
            error: 'Failed to process image with AI'
        };
    }
}

module.exports = { verifyPaymentScreenshot };
