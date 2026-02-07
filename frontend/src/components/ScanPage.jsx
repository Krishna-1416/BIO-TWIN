import React, { useState } from 'react';

const ScanPage = ({ onScanComplete, onSkip, embedded }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
            setError(null);
        }
    };

    const handleFileSelect = async (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
            setError(null);
        }
    };

    const handleStartScan = async () => {
        if (!selectedFile) return;

        setIsScanning(true);
        setError(null);

        try {
            await onScanComplete(selectedFile);
        } catch (err) {
            setError("Failed to scan document. Please try again.");
            setIsScanning(false);
        }
    };

    const handleCancelSelection = () => {
        setSelectedFile(null);
        setError(null);
    };

    return (
        <div className={`scan-page ${isDragging ? 'dragging' : ''} ${embedded ? 'embedded' : ''}`}>
            {/* Hamburger menu for standalone mode on mobile */}
            {!embedded && (
                <button
                    className="mobile-menu-btn"
                    onClick={onSkip}
                    aria-label="Menu"
                >
                    <span className="material-icons">menu</span>
                </button>
            )}

            <div className="scan-container">
                <h1>Upload Medical Report</h1>
                <p className="subtitle">Upload your blood test, lab report, or checkup summary to generate your Bio-Twin.</p>

                {!isScanning && !selectedFile ? (
                    <div
                        className="drop-zone"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="icon">📄</div>
                        <h3>Drag & Drop your PDF/Image here</h3>
                        <p>or</p>
                        <label className="btn-primary">
                            Browse Files
                            <input
                                type="file"
                                hidden
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileSelect}
                            />
                        </label>
                        {error && <p className="error-msg">{error}</p>}
                    </div>
                ) : !isScanning && selectedFile ? (
                    <div className="selected-file-state">
                        <div className="file-icon-large">📄</div>
                        <h3>{selectedFile.name}</h3>
                        <p className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>

                        <div className="action-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                            <button className="btn-secondary" onClick={handleCancelSelection}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleStartScan}>
                                Start Analysis
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="scanning-state">
                        <div className="spinner"></div>
                        <h3>Scanning Document...</h3>
                        <p>Analyzing biomarkers and generating health insights.</p>
                    </div>
                )}

                {!isScanning && (
                    <button className="btn-text" onClick={onSkip}>
                        Skip and view Dashboard
                    </button>
                )}
            </div>
        </div>
    );
};

export default ScanPage;
