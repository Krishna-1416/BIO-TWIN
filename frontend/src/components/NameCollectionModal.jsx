import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import './NameCollectionModal.css';

const NameCollectionModal = ({ onComplete, onSkip }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!firstName.trim() || !lastName.trim()) {
            setError('Please enter both first and last name');
            return;
        }

        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('No user logged in');
            }

            const fullName = `${firstName.trim()} ${lastName.trim()}`;

            // Update Firebase Auth profile
            await updateProfile(user, {
                displayName: fullName
            });

            // Save to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: user.email,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            onComplete(firstName.trim());
        } catch (err) {
            console.error('Error saving name:', err);
            setError('Failed to save your name. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="name-modal-overlay">
            <div className="name-modal-card">
                <h2>Welcome! Let's personalize your experience</h2>
                <p className="name-modal-subtitle">Please tell us your name</p>

                <form onSubmit={handleSubmit} className="name-modal-form">
                    {error && <div className="name-modal-error">{error}</div>}

                    <div className="name-input-group">
                        <input
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <div className="name-input-group">
                        <input
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="name-modal-actions">
                        <button type="submit" className="name-save-btn" disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            className="name-skip-btn"
                            onClick={onSkip}
                            disabled={loading}
                        >
                            Skip for now
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NameCollectionModal;
