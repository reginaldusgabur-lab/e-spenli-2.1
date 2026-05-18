
// Minimal Test Component
// This is to test the build environment itself.

export default function UserReportDetailPage({ params }: { params: { userId: string } }) {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Build Test Page</h1>
      <p>This is a minimal component to check if the Vercel build process is working correctly.</p>
      <p>If you can see this page, it means the build succeeded and the problem is within the original, more complex code.</p>
      <p>User ID from URL: <strong>{params.userId}</strong></p>
    </div>
  );
}
