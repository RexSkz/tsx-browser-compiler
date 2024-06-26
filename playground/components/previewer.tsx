import React from 'react';

class ErrorBoundary extends React.Component<React.PropsWithChildren> {
  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  state = { error: null as Error | null };

  render() {
    if (this.state.error) {
      return (
        <pre className="playground-error-boundary">
          <b>Error while rendering.</b><br />
          {this.state.error.stack}
        </pre>
      );
    }
    return this.props.children;
  }
}

interface PreviewerProps {
  className?: string;
}

const Previewer: React.FC<React.PropsWithChildren<PreviewerProps>> = ({
  className,
  children,
}) => {
  const [key, setKey] = React.useState(0);

  React.useEffect(() => {
    setKey(prev => prev + 1);
  }, [children]);

  return (
    <div className={className}>
      <ErrorBoundary key={key}>
        {children}
      </ErrorBoundary>
    </div>
  );
};

export default Previewer;
