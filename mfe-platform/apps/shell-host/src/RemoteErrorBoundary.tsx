import { ErrorState } from '@mfe/ui-kit';
import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  title: string;
  onError: (message: string) => void;
  fallback?: ReactNode;
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class RemoteErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    this.props.onError(error.message);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorState title={`${this.props.title} failed`} message={this.state.message} />;
    }

    return this.props.children;
  }
}
