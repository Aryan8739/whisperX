import { Component } from "react";

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div id="feed">
                    <div className="post">
                        <div className="post-header">system@error ➤ [just now]</div>
                        <div className="post-text">
                            something broke. try refreshing.
                            <br />
                            <span style={{ opacity: 0.5 }}>{this.state.error?.message}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}