'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, ChevronDown, ChevronUp, Save, Image } from 'lucide-react';
import Sidebar from './sidebar';
import { v4 as uuidv4 } from 'uuid';

interface GenerationResponse {
  topics_and_subtopics: {
    title: string;
    topics: {
      title: string;
      subtopics: string[];
    }[];
  };
  interviewQuestions: {
    questions: {
      subtopic: string;
      questions: string[];
    }[];
  };
  detailedContent: {
    sections: {
      chapterTitle: string;
      chapterContent: string;
      subtopics: {
        title: string;
        content: string;
      }[];
    }[];
  };
  diagram: string;
}

interface DiagramResponse {
  imageUrl: string;
  createEraserFileUrl: string;
  diagrams: {
    diagramType: string;
    code: string;
  }[];
}

export default function ContentGenerator() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Add state for collapsible cards
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  // const [isDiagramExpanded, setIsDiagramExpanded] = useState(false);
  const [isQuestionsExpanded, setIsQuestionsExpanded] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  
  // Add state for sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Add state for diagram generation
  const [generatingDiagram, setGeneratingDiagram] = useState<string | null>(null);
  const [diagrams, setDiagrams] = useState<Record<string, DiagramResponse>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/content-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Function to save content to localStorage
  const saveContent = () => {
    if (!result) return;
    
    try {
      // Create content object with metadata
      const contentItem = {
        id: uuidv4(),
        title: result.topics_and_subtopics.title || `Content ${new Date().toLocaleString()}`,
        timestamp: Date.now(),
        data: result,
        diagrams: diagrams,
      };
      
      // Get existing saved content
      const existingContent = localStorage.getItem('euron-saved-contents');
      let savedContents = existingContent ? JSON.parse(existingContent) : [];
      
      // Add new content to the list
      savedContents = [contentItem, ...savedContents];
      
      // Save to localStorage
      localStorage.setItem('euron-saved-contents', JSON.stringify(savedContents));
      
      // Show notification or feedback
      alert('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content');
    }
  };

  // Function to load content from sidebar
  const loadContent = (content: Record<string, unknown>) => {
    setResult(content as unknown as GenerationResponse);
    if ('diagrams' in content && content.diagrams) {
      setDiagrams(content.diagrams as Record<string, DiagramResponse>);
    }
    setIsSidebarOpen(false);
  };

  // Function to generate diagram
  const generateDiagram = async (text: string, id: string, diagramType: string = 'concept-map') => {
    setGeneratingDiagram(id);
    
    try {
      const response = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          diagramType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate diagram');
      }

      const data = await response.json();
      setDiagrams(prev => ({
        ...prev,
        [id]: data
      }));
    } catch (err) {
      console.error('Error generating diagram:', err);
      alert('Failed to generate diagram');
    } finally {
      setGeneratingDiagram(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        onSelectContent={loadContent}
      />

      <Card className="bg-white/50 p-6 shadow-lg backdrop-blur-sm dark:bg-gray-800/50 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="content-input"
              className="block text-lg font-medium text-gray-700 dark:text-gray-200"
            >
              What would you like to generate content for?
            </label>
            <Input
              id="content-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your syllabus..."
              className="w-full py-6 text-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-6 text-lg font-medium transition-all duration-200 hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 sm:w-auto"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="animate-spin" size={20} />
                <span>Generating...</span>
              </span>
            ) : (
              'Generate Content'
            )}
          </Button>
        </form>
      </Card>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/50">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-8">
          {/* Save button */}
          <div className="flex justify-end">
            <Button
              onClick={saveContent}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <Save size={18} />
              <span>Save Content</span>
            </Button>
          </div>

          {/* Overview Card */}
          <Card className="overflow-hidden bg-white/50 shadow-lg backdrop-blur-sm dark:bg-gray-800/50">
            <div className="border-b border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Course Overview</h3>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => generateDiagram(
                    `Create a concept map for this course: ${result.topics_and_subtopics.title}. The main topics are: ${result.topics_and_subtopics.topics.map(t => t.title).join(', ')}`,
                    'overview',
                    'concept-map'
                  )}
                  disabled={!!generatingDiagram}
                  className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 h-8"
                >
                  {generatingDiagram === 'overview' ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Image size={16} />
                  )}
                  <span className="text-sm">Generate Diagram</span>
                </Button>
                <div 
                  className="cursor-pointer"
                  onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                >
                  {isOverviewExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>
            {diagrams['overview'] && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center">
                  <img 
                    src={diagrams['overview'].imageUrl} 
                    alt="Course Overview Diagram" 
                    className="max-w-full rounded-lg shadow-md"
                  />
                  <a 
                    href={diagrams['overview'].createEraserFileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Open in Eraser
                  </a>
                </div>
              </div>
            )}
            {isOverviewExpanded && (
              <div className="p-6">
                <h4 className="mb-6 text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  {result.topics_and_subtopics.title}
                </h4>
                <div className="grid gap-6 md:grid-cols-2">
                  {result.topics_and_subtopics.topics.map((topic, topicIndex) => (
                    <div key={topicIndex} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                          {topic.title}
                        </h5>
                        <Button
                          onClick={() => generateDiagram(
                            `Create a concept map for this topic: ${topic.title}. The subtopics are: ${topic.subtopics.join(', ')}`,
                            `topic-${topicIndex}`,
                            'concept-map'
                          )}
                          disabled={!!generatingDiagram}
                          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-2 py-1 h-7"
                        >
                          {generatingDiagram === `topic-${topicIndex}` ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <Image size={14} />
                          )}
                          <span className="text-xs">Generate Diagram</span>
                        </Button>
                      </div>
                      {diagrams[`topic-${topicIndex}`] && (
                        <div className="mb-3">
                          <div className="flex flex-col items-center">
                            <img 
                              src={diagrams[`topic-${topicIndex}`].imageUrl} 
                              alt={`${topic.title} Diagram`} 
                              className="max-w-full rounded-lg shadow-md"
                            />
                            <a 
                              href={diagrams[`topic-${topicIndex}`].createEraserFileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-2 text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Open in Eraser
                            </a>
                          </div>
                        </div>
                      )}
                      <ul className="list-disc space-y-1.5 pl-5">
                        {topic.subtopics.map((subtopic, subtopicIndex) => (
                          <li key={subtopicIndex} className="text-gray-700 dark:text-gray-200">
                            {subtopic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Interview Questions Card */}
          <Card className="overflow-hidden bg-white/50 shadow-lg backdrop-blur-sm dark:bg-gray-800/50">
            <div className="border-b border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Interview Questions</h3>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => generateDiagram(
                    `Create a mind map of interview questions for ${result.topics_and_subtopics.title}. The questions are organized by subtopics: ${result.interviewQuestions.questions.map(q => q.subtopic).join(', ')}`,
                    'interview-questions',
                    'mind-map'
                  )}
                  disabled={!!generatingDiagram}
                  className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 h-8"
                >
                  {generatingDiagram === 'interview-questions' ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Image size={16} />
                  )}
                  <span className="text-sm">Generate Diagram</span>
                </Button>
                <div 
                  className="cursor-pointer"
                  onClick={() => setIsQuestionsExpanded(!isQuestionsExpanded)}
                >
                  {isQuestionsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>
            {diagrams['interview-questions'] && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center">
                  <img 
                    src={diagrams['interview-questions'].imageUrl} 
                    alt="Interview Questions Diagram" 
                    className="max-w-full rounded-lg shadow-md"
                  />
                  <a 
                    href={diagrams['interview-questions'].createEraserFileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Open in Eraser
                  </a>
                </div>
              </div>
            )}
            {isQuestionsExpanded && (
              <div className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {result.interviewQuestions.questions.map((item, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                          {item.subtopic}
                        </h4>
                        <Button
                          onClick={() => generateDiagram(
                            `Create a mind map of interview questions for ${item.subtopic}: ${item.questions.join('. ')}`,
                            `question-${index}`,
                            'mind-map'
                          )}
                          disabled={!!generatingDiagram}
                          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-2 py-1 h-7"
                        >
                          {generatingDiagram === `question-${index}` ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <Image size={14} />
                          )}
                          <span className="text-xs">Generate Diagram</span>
                        </Button>
                      </div>
                      {diagrams[`question-${index}`] && (
                        <div className="mb-4">
                          <div className="flex flex-col items-center">
                            <img 
                              src={diagrams[`question-${index}`].imageUrl} 
                              alt={`${item.subtopic} Questions Diagram`} 
                              className="max-w-full rounded-lg shadow-md"
                            />
                            <a 
                              href={diagrams[`question-${index}`].createEraserFileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-2 text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Open in Eraser
                            </a>
                          </div>
                        </div>
                      )}
                      <ol className="list-decimal space-y-2 pl-5">
                        {item.questions.map((question, qIndex) => (
                          <li key={qIndex} className="text-gray-700 dark:text-gray-200">
                            {question}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Detailed Content Card */}
          <Card className="overflow-hidden bg-white/50 shadow-lg backdrop-blur-sm dark:bg-gray-800/50">
            <div className="border-b border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Detailed Content</h3>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => generateDiagram(
                    `Create a detailed flowchart for the course: ${result.topics_and_subtopics.title}. The chapters are: ${result.detailedContent.sections.map(s => s.chapterTitle).join(', ')}`,
                    'detailed-content',
                    'flowchart'
                  )}
                  disabled={!!generatingDiagram}
                  className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 h-8"
                >
                  {generatingDiagram === 'detailed-content' ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Image size={16} />
                  )}
                  <span className="text-sm">Generate Diagram</span>
                </Button>
                <div 
                  className="cursor-pointer"
                  onClick={() => setIsContentExpanded(!isContentExpanded)}
                >
                  {isContentExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>
            {diagrams['detailed-content'] && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center">
                  <img 
                    src={diagrams['detailed-content'].imageUrl} 
                    alt="Detailed Content Diagram" 
                    className="max-w-full rounded-lg shadow-md"
                  />
                  <a 
                    href={diagrams['detailed-content'].createEraserFileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Open in Eraser
                  </a>
                </div>
              </div>
            )}
            {isContentExpanded && (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {result.detailedContent.sections.map((section, index) => (
                  <div key={index} className="p-6">
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xl font-medium text-gray-800 dark:text-gray-200">
                          {section.chapterTitle}
                        </h4>
                        <Button
                          onClick={() => generateDiagram(
                            `Create a flowchart for this chapter: ${section.chapterTitle}. The content is about: ${section.chapterContent.substring(0, 200)}...`,
                            `chapter-${index}`,
                            'flowchart'
                          )}
                          disabled={!!generatingDiagram}
                          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-2 py-1 h-7"
                        >
                          {generatingDiagram === `chapter-${index}` ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <Image size={14} />
                          )}
                          <span className="text-xs">Generate Diagram</span>
                        </Button>
                      </div>
                      {diagrams[`chapter-${index}`] && (
                        <div className="mb-4">
                          <div className="flex flex-col items-center">
                            <img 
                              src={diagrams[`chapter-${index}`].imageUrl} 
                              alt={`${section.chapterTitle} Diagram`} 
                              className="max-w-full rounded-lg shadow-md"
                            />
                            <a 
                              href={diagrams[`chapter-${index}`].createEraserFileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-2 text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Open in Eraser
                            </a>
                          </div>
                        </div>
                      )}
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                        <div className="prose prose-gray dark:prose-invert max-w-none">
                          <p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-200">
                            {section.chapterContent}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {section.subtopics.map((subtopic, subtopicIndex) => (
                        <div key={subtopicIndex} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                              {subtopic.title}
                            </h5>
                            <Button
                              onClick={() => generateDiagram(
                                `Create a concept map for this subtopic: ${subtopic.title}. The content is about: ${subtopic.content.substring(0, 200)}...`,
                                `subtopic-${index}-${subtopicIndex}`,
                                'concept-map'
                              )}
                              disabled={!!generatingDiagram}
                              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-2 py-1 h-7"
                            >
                              {generatingDiagram === `subtopic-${index}-${subtopicIndex}` ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <Image size={14} />
                              )}
                              <span className="text-xs">Generate Diagram</span>
                            </Button>
                          </div>
                          {diagrams[`subtopic-${index}-${subtopicIndex}`] && (
                            <div className="mb-3">
                              <div className="flex flex-col items-center">
                                <img 
                                  src={diagrams[`subtopic-${index}-${subtopicIndex}`].imageUrl} 
                                  alt={`${subtopic.title} Diagram`} 
                                  className="max-w-full rounded-lg shadow-md"
                                />
                                <a 
                                  href={diagrams[`subtopic-${index}-${subtopicIndex}`].createEraserFileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="mt-2 text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  Open in Eraser
                                </a>
                              </div>
                            </div>
                          )}
                          <div className="prose prose-gray dark:prose-invert max-w-none">
                            <p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-200">
                              {subtopic.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
