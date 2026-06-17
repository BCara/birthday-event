import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

/**
 * A root error boundary that catches all unexpected errors in the app.
 * It specifically handles "ChunkLoadError" (module import failures) by 
 * offering a reload option, which usually fixes the issue after a new deployment.
 */
export default function RootErrorBoundary() {
  const error = useRouteError();
  console.error('Root Error Boundary caught:', error);

  // Check if it's a module loading error (typical after new deployment)
  const isChunkError = error?.message?.includes('dynamically imported module') || 
                       error?.message?.includes('Failed to fetch dynamically imported module');

  if (isChunkError) {
    return (
      <div className="kb-fatal-error">
        <div className="kb-error-card">
          <div className="kb-error-emoji">💿</div>
          <h1>App Update Required</h1>
          <p>A new version of Tiny Party Portal is available. We need to refresh the page to load it correctly.</p>
          <button 
            className="kb-btn kb-btn-primary" 
            onClick={() => window.location.reload()}
          >
            Update & Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kb-fatal-error">
      <div className="kb-error-card">
        <div className="kb-error-emoji">⚠️</div>
        <h1>Unexpected Error</h1>
        <p>
          {isRouteErrorResponse(error) 
            ? `${error.status} ${error.statusText}` 
            : error?.message || 'Something went wrong.'}
        </p>
        <div className="kb-error-actions">
          <button 
            className="kb-btn kb-btn-primary" 
            onClick={() => window.location.assign('/')}
          >
            Go to Home
          </button>
          <button 
            className="kb-btn kb-btn-outline" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
