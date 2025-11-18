import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function FlashMessage() {
  const { ok, error } = usePage().props as { ok?: string; error?: string };
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (ok || error) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [ok, error]);

  if (!visible || (!ok && !error)) {
    return null;
  }

  const isSuccess = !!ok;
  const message = ok || error;

  return (
    <div
      className={`mb-4 rounded-md p-4 ${
        isSuccess
          ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200'
          : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isSuccess ? (
            <svg
              className="h-5 w-5 text-green-400 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-red-400 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="ml-4 text-sm font-medium hover:opacity-75"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
