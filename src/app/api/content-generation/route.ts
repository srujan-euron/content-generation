import { openai } from '@ai-sdk/openai';
// import { google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

async function generateContent(input: string) {
  const model = openai('gpt-4o');

  // First step: Generate topics and subtopics
  const { object: topics_and_subtopics } = await generateObject({
    model,
    prompt: `Based on this syllabus or topic: "${input}", create a comprehensive structure for a book or course.

Instructions:
1. Analyze the main subject matter thoroughly
2. Break it down into major topics (chapters)
3. For each topic, create 3-5 detailed subtopics
4. Ensure logical flow and progression of concepts
5. Include both theoretical and practical aspects

Example format:
{
  "title": "Main Subject",
  "topics": [
    {
      "title": "Chapter 1: Introduction to [Topic]",
      "subtopics": [
        "1.1 Understanding the Basics",
        "1.2 Historical Context",
        "1.3 Key Principles"
      ]
    },
    {
      "title": "Chapter 2: Fundamentals of [Topic]",
      "subtopics": [
        "2.1 Core Concepts",
        "2.2 Building Blocks",
        "2.3 Essential Components",
        "2.4 Best Practices"
      ]
    }
  ]
}

Make sure each chapter and subtopic title is clear, descriptive, and the progression makes sense for learning.`,
    schema: z.object({
      title: z.string(),
      topics: z.array(
        z.object({
          title: z.string(),
          subtopics: z.array(z.string())
        })
      ),
    }),
    system: `You are an expert educational content architect specializing in creating well-structured learning materials.

Your task is to:
1. Analyze the given subject matter deeply
2. Create a logical and comprehensive chapter structure
3. Break down each chapter into meaningful subtopics
4. Ensure each chapter and subtopic builds upon previous knowledge
5. Include both foundational and advanced concepts
6. Balance theoretical knowledge with practical applications
7. Consider the learner's progression from basics to mastery
8. Make chapter and subtopic titles clear, descriptive, and engaging
9. Maintain consistent naming and formatting conventions`,
  });

  // Create Interview Questions
  const { object: interviewQuestions } = await generateObject({
    model,
    prompt: `Create 10 interview questions for each subtopic: ${JSON.stringify(topics_and_subtopics)}`,
    schema: z.object({
      questions: z.array(z.object({
        subtopic: z.string(),
        questions: z.array(z.string())
      }))
    }),
  });

  // Generate detailed content
  const { object: detailedContent } = await generateObject({
    model,
    prompt: `Create extremely detailed content for each chapter and its subtopics from this structure: ${JSON.stringify(topics_and_subtopics)}

Instructions:
1. For each chapter and subtopic, provide:
   - A comprehensive introduction
   - Detailed explanation of key concepts and principles
   - In-depth theoretical background
   - Multiple real-world examples and case studies
   - Step-by-step tutorials or walkthroughs
   - Practical exercises and applications
   - Common pitfalls and how to avoid them
   - Best practices and industry standards
   - Summary of key points
   - Review questions and discussion topics

2. Ensure content:
   - Is extremely detailed and thorough
   - Flows logically from basic to advanced concepts
   - Includes plenty of examples and illustrations
   - Connects theory to real-world practice
   - Is clear, engaging, and professional
   - Covers both fundamentals and edge cases
   - Addresses common misconceptions
   - Provides actionable insights

Format the content with:
- Clear hierarchical structure
- Well-organized sections and subsections
- Bullet points for key concepts
- Numbered steps for procedures
- Code examples where appropriate
- Practice exercises
- Discussion questions
- Further reading suggestions`,
    schema: z.object({
      sections: z.array(
        z.object({
          chapterTitle: z.string(),
          chapterContent: z.string(),
          subtopics: z.array(
            z.object({
              title: z.string(),
              content: z.string()
            })
          )
        })
      ),
    }),
    system: `You are an expert educational content architect specializing in creating well-structured learning materials.
    
    Create content that is extremely detailed and thorough, and flows logically from basic to advanced concepts.
    Include plenty of examples and illustrations, and connect theory to real-world practice.
    Make it clear, engaging, and professional.
    Cover both fundamentals and edge cases.
    Address common misconceptions and provide actionable insights.

    Content for each subtopic should be atleast 2000 words.
    `
  });

  // Generate diagram
  const { text: diagram } = await generateText({
    model,
    prompt: `Create a detailed ASCII diagram showing the hierarchical structure of this book/course: ${JSON.stringify(topics_and_subtopics)}

Instructions:
1. Show the main title at the top
2. Connect it to each chapter
3. Show relationships between topics
4. Use ASCII characters to create:
   - Boxes for main topics
   - Lines for connections
   - Arrows for flow
   - Clear hierarchy levels
5. Make it visually clear and easy to understand
6. Include chapter numbers and short titles
7. Show progression and relationships`,

    system: `You are an expert in creating clear, visual representations of complex information structures.
Create an ASCII diagram that:
- Shows clear hierarchy
- Uses simple lines and boxes
- Makes relationships obvious
- Is easy to read and understand
- Fits well in a terminal or text display`,
  });

  return {
    topics_and_subtopics,
    interviewQuestions,
    detailedContent,
    diagram,
  };
}

export async function POST(request: Request) {
  try {
    const { input } = await request.json();

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input is required and must be a string' },
        { status: 400 },
      );
    }

    const result = await generateContent(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
