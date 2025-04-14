import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to the Agency Dashboard
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Are you an agency admin? Get started to create and manage rides. If you’re a regular user, please download our mobile app.
        </p>
        <Link href="/dashboard">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            Get Started
          </button>
        </Link>
        <p className="mt-4 text-sm text-gray-500">
          Normal users: Download the mobile app from your app store.
        </p>
      </div>
    </div>
  );
}