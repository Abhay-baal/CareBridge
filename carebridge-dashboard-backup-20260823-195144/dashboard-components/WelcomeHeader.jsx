export default function WelcomeHeader({ name }) {
  return (
    <div className="mb-6">
      <p className="text-gray-600">
        Good Morning 👋
      </p>

      <h1 className="text-2xl font-bold text-gray-900">
        Hi, {name}
      </h1>
    </div>
  );
}