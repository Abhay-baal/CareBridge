export default function Input({
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    name,
    error,
}) {
    return (
        <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-800">
                {label}
            </label>

            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-500 outline-none transition-colors duration-150 focus:border-blue-500"
            />

            {error && (
                <p className="mt-1 text-sm text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
}
