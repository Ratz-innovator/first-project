import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

export async function POST(request: NextRequest) {
  try {
    // Extract data from request body
    const body = await request.json();
    const { prompt, updatePrompt, currentCode } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Determine if this is an initial generation or an update request
    const isUpdate = !!updatePrompt && !!currentCode;
    
    let enhancedPrompt = '';
    
    if (isUpdate) {
      console.log('Processing update:', updatePrompt);
      
      // Create a prompt for updating existing code
      enhancedPrompt = `
        I have an HTML webpage that was created based on this description: "${prompt}".
        
        The current HTML code is:
        \`\`\`html
        ${currentCode}
        \`\`\`
        
        Please update this HTML code according to this new request: "${updatePrompt}"
        
        Requirements:
        - Preserve the overall structure but implement the requested changes
        - Keep all existing functionality intact
        - Maintain or improve responsive design
        - Ensure the code is clean and well-formatted
        
        Return ONLY the complete updated HTML code without any explanation or markdown.
      `;
    } else {
      console.log('Processing prompt:', prompt);
      
      // Create a prompt for initial code generation
      enhancedPrompt = `
        Create a complete HTML webpage based on this description: "${prompt}".
        The page should include:
        - Modern, responsive design with CSS
        - Some interactive elements using JavaScript
        - Clean, well-structured code
        - Appropriate styling and layout
        
        Return ONLY the complete HTML code without any explanation.
      `;
    }

    // Call the Gemini API
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Return the generated HTML code
    return NextResponse.json({ code: text });
  } catch (error: any) {
    console.error('Error generating code with Gemini:', error);
    return NextResponse.json(
      { error: error.message || 'Error generating code with Gemini API' },
      { status: 500 }
    );
  }
} 