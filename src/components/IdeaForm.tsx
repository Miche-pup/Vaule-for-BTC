'use client';

import { useState } from 'react';

interface IdeaFormProps {
  onSuccess?: () => void;
}

export default function IdeaForm({ onSuccess }: IdeaFormProps) {
  const [formData, setFormData] = useState({
    text_content: '',
    submitter_name: '',
    submitter_ln_address: '',
    submitter_contact_info: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit idea');
      }

      // Clear form
      setFormData({
        text_content: '',
        submitter_name: '',
        submitter_ln_address: '',
        submitter_contact_info: '',
      });

      // Call onSuccess callback if provided
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit idea');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="text_content" className="block text-sm font-medium text-gray-700 mb-1">
          Your Idea
        </label>
        <textarea
          id="text_content"
          name="text_content"
          value={formData.text_content}
          onChange={handleChange}
          required
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
          placeholder="Share your idea for the Bitcoin conference..."
        />
      </div>

      <div>
        <label htmlFor="submitter_name" className="block text-sm font-medium text-gray-700 mb-1">
          Your Name (optional)
        </label>
        <input
          type="text"
          id="submitter_name"
          name="submitter_name"
          value={formData.submitter_name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
          placeholder="Anonymous"
        />
      </div>

      <div>
        <label htmlFor="submitter_ln_address" className="block text-sm font-medium text-gray-700 mb-1">
          Lightning Address (optional)
        </label>
        <input
          type="text"
          id="submitter_ln_address"
          name="submitter_ln_address"
          value={formData.submitter_ln_address}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
          placeholder="yourname@getalby.com"
        />
      </div>

      <div>
        <label htmlFor="submitter_contact_info" className="block text-sm font-medium text-gray-700 mb-1">
          Contact Information (optional)
        </label>
        <input
          type="text"
          id="submitter_contact_info"
          name="submitter_contact_info"
          value={formData.submitter_contact_info}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
          placeholder="Email, Twitter, etc."
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Idea'}
      </button>
    </form>
  );
} 