import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 md:p-12">
        <div className="text-center mb-8">
          <span className="inline-block bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            v1.0.0
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            🎨 D-Fluency CRM
          </h1>
          <p className="text-gray-600 text-lg">
            Modern React/Next.js Interface with AI-Powered Features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-3">📡 Available Pages</h2>
            <div className="grid grid-cols-1 gap-2">
              <Link href="/login" className="bg-white p-3 rounded-md border border-gray-200 text-purple-600 font-medium hover:bg-purple-600 hover:text-white transition-all">
                /login - Authentication
              </Link>
              <Link href="/register" className="bg-white p-3 rounded-md border border-gray-200 text-purple-600 font-medium hover:bg-purple-600 hover:text-white transition-all">
                /register - User Registration
              </Link>
              <Link href="/dashboard" className="bg-white p-3 rounded-md border border-gray-200 text-purple-600 font-medium hover:bg-purple-600 hover:text-white transition-all">
                /dashboard - AI-Powered Dashboard
              </Link>
              <Link href="/leads" className="bg-white p-3 rounded-md border border-gray-200 text-purple-600 font-medium hover:bg-purple-600 hover:text-white transition-all">
                /leads - Lead Management
              </Link>
              <Link href="/users" className="bg-white p-3 rounded-md border border-gray-200 text-purple-600 font-medium hover:bg-purple-600 hover:text-white transition-all">
                /users - User Management
              </Link>
              <Link href="/settings" className="bg-white p-3 rounded-md border border-gray-200 text-purple-600 font-medium hover:bg-purple-600 hover:text-white transition-all">
                /settings - Application Settings
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-3">✨ Frontend Features</h2>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Next.js 15.1.4 with App Router</li>
                <li>✓ TypeScript + TailwindCSS</li>
                <li>✓ Lucide Icons + shadcn/ui</li>
                <li>✓ Real-time AI Dashboard</li>
                <li>✓ Responsive Design</li>
              </ul>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-3">🤖 AI Features</h2>
              <ul className="space-y-2 text-gray-700">
                <li>✓ 18 AI-Powered Endpoints</li>
                <li>✓ Lead Scoring & Sentiment Analysis</li>
                <li>✓ Revenue Forecasting</li>
                <li>✓ Smart Lead Assignment</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all transform hover:scale-105"
          >
            Get Started →
          </Link>
        </div>
      </div>
    </div>
  );
}
