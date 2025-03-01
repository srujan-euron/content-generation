import ContentGenerator from "@/components/content-generation";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
    <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="mb-12 text-center">
        <h1 className="mb-4 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
          Content Generation
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          Generate content for your course or book. Enter your syllabus below to get started.
        </p>
      </div>
      <ContentGenerator />
    </div>
  </div>
  );
}
