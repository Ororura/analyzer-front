import { Component, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export class ContentBoundary extends Component<{ children: ReactNode; title: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="card-error" role="alert">
        <AlertCircle aria-hidden="true" size={22} />
        <p>{this.props.title}</p>
        <Button variant="outline" size="sm" onClick={() => this.setState({ failed: false })}>
          Повторить
        </Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
