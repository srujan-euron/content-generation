import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, diagramType = 'cloud-architecture-diagram', theme = 'light', mode = 'standard' } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 },
      );
    }

    const eraserApiToken = process.env.ERASER_API_TOKEN;
    
    if (!eraserApiToken) {
      return NextResponse.json(
        { error: 'Eraser API token is not configured' },
        { status: 500 },
      );
    }

    const response = await fetch('https://app.eraser.io/api/render/prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${eraserApiToken}`,
      },
      body: JSON.stringify({
        theme,
        mode,
        diagramType,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Eraser API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate diagram' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Diagram generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate diagram' },
      { status: 500 },
    );
  }
} 