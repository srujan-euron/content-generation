'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, ChevronDown, ChevronUp, Save } from 'lucide-react';
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

export default function ContentGenerator() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Add state for collapsible cards
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [isDiagramExpanded, setIsDiagramExpanded] = useState(false);
  const [isQuestionsExpanded, setIsQuestionsExpanded] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  
  // Add state for sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    setIsSidebarOpen(false);
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
            <div 
              className="border-b border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30 flex justify-between items-center cursor-pointer"
              onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
            >
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Course Overview</h3>
              {isOverviewExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {isOverviewExpanded && (
              <div className="p-6">
                <h4 className="mb-6 text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  {result.topics_and_subtopics.title}
                </h4>
                <div className="grid gap-6 md:grid-cols-2">
                  {result.topics_and_subtopics.topics.map((topic, topicIndex) => (
                    <div key={topicIndex} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <h5 className="mb-3 text-lg font-medium text-gray-800 dark:text-gray-200">
                        {topic.title}
                      </h5>
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

          {/* Visual Structure Card */}
          {result.diagram && (
            <Card className="overflow-hidden bg-white/50 shadow-lg backdrop-blur-sm dark:bg-gray-800/50">
              <div 
                className="border-b border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30 flex justify-between items-center cursor-pointer"
                onClick={() => setIsDiagramExpanded(!isDiagramExpanded)}
              >
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Visual Structure</h3>
                {isDiagramExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {isDiagramExpanded && (
                <div className="p-6">
                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 dark:text-gray-200">
                      {result.diagram}
                    </pre>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Interview Questions Card */}
          <Card className="overflow-hidden bg-white/50 shadow-lg backdrop-blur-sm dark:bg-gray-800/50">
            <div 
              className="border-b border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30 flex justify-between items-center cursor-pointer"
              onClick={() => setIsQuestionsExpanded(!isQuestionsExpanded)}
            >
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Interview Questions</h3>
              {isQuestionsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {isQuestionsExpanded && (
              <div className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {result.interviewQuestions.questions.map((item, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-gray-200">
                        {item.subtopic}
                      </h4>
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
            <div 
              className="border-b border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30 flex justify-between items-center cursor-pointer"
              onClick={() => setIsContentExpanded(!isContentExpanded)}
            >
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Detailed Content</h3>
              {isContentExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {isContentExpanded && (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {result.detailedContent.sections.map((section, index) => (
                  <div key={index} className="p-6">
                    <div className="mb-8">
                      <h4 className="mb-4 text-xl font-medium text-gray-800 dark:text-gray-200">
                        {section.chapterTitle}
                      </h4>
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
                          <h5 className="mb-3 text-lg font-medium text-gray-800 dark:text-gray-200">
                            {subtopic.title}
                          </h5>
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
