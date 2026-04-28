export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-bg text-center px-4">
      <div className="text-8xl font-black text-primary mb-4">404</div>
      <h1 className="text-3xl font-bold text-white mb-2">Page Not Found</h1>
      <p className="text-dark-subtext mb-8">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <a href="/" className="btn-primary">
        Back to Home
      </a>
    </div>
  );
}
