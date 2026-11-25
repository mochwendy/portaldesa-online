import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Optional: log error to console
    console.error('Error caught by ErrorBoundary:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI with error information
      return (
        <div className="min-h-screen bg-red-50 text-red-800 p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Terjadi Error</h2>
          <p className="text-base mb-6">Terjadi kesalahan saat memuat aplikasi.</p>
          <details className="mx-auto w-full max-w-md text-sm">
            <summary>Lihat detail error</summary>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">{this.state.error.toString()}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;