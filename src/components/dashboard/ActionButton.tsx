import React from 'react';

interface Props {
  loading: boolean;
}

export default function ActionButton({ loading }: Props) {
  return (
    <div className="flex justify-end pt-4">
      <button
        type="submit"
        disabled={loading}
        title="Analyze your GitHub commits and generate activity summary with AI insights"
        className="px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center"
        style={{ 
          backgroundColor: loading ? 'rgba(0, 0, 0, 0.3)' : 'var(--dark-slate)',
          color: 'var(--neon-green)',
          border: '2px solid var(--neon-green)',
          boxShadow: loading ? 'none' : '0 0 10px rgba(0, 255, 135, 0.2)',
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
        onMouseOver={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = 'var(--neon-green)';
            e.currentTarget.style.color = 'var(--dark-slate)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 135, 0.4)';
          }
        }}
        onMouseOut={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = 'var(--dark-slate)';
            e.currentTarget.style.color = 'var(--neon-green)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 135, 0.2)';
          }
        }}
      >
        {loading ? (
          <>
            <span className="mr-2 inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" 
              style={{ borderColor: 'var(--neon-green)', borderTopColor: 'transparent' }}></span>
            ANALYZING DATA...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
            </svg>
            ANALYZE COMMITS
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
