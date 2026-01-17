import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import './SettingsPage.css';

const SettingsPage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            setEmail(user.email);

            // Try to load from Firestore first
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (userDoc.exists()) {
                const data = userDoc.data();
                setFirstName(data.firstName || '');
                setLastName(data.lastName || '');
            } else if (user.displayName) {
                // Fallback to displayName if Firestore doc doesn't exist
                const nameParts = user.displayName.split(' ');
                setFirstName(nameParts[0] || '');
                setLastName(nameParts.slice(1).join(' ') || '');
            }
        } catch (err) {
            console.error('Error loading profile:', err);
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!firstName.trim() || !lastName.trim()) {
            setError('Please enter both first and last name');
            return;
        }

        setSaving(true);

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

            // Update Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                await updateDoc(userDocRef, {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    updatedAt: new Date()
                });
            } else {
                await setDoc(userDocRef, {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: user.email,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }

            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error saving profile:', err);
            // Show descriptive error to user
            let errorMessage = 'Failed to save changes. Please try again.';
            if (err.code === 'permission-denied') {
                errorMessage = 'Permission denied. Please check your account status.';
            } else if (err.message) {
                errorMessage = `Error: ${err.message}`;
            }
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="settings-container">
                <div className="settings-loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1>Settings</h1>
                <p className="settings-subtitle">Manage your account and preferences</p>
            </div>

            <div className="settings-content">
                {/* Profile Section */}
                <section className="settings-section">
                    <h2 className="section-title">Profile Information</h2>

                    <form onSubmit={handleSave} className="settings-form">
                        {error && <div className="settings-error">{error}</div>}
                        {success && <div className="settings-success">{success}</div>}

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    disabled={saving}
                                    placeholder="Enter first name"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName">Last Name</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    disabled={saving}
                                    placeholder="Enter last name"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                disabled
                                className="disabled-input"
                            />
                            <span className="input-hint">Email cannot be changed</span>
                        </div>

                        <button type="submit" className="save-btn" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </section>

                {/* Additional Settings Sections (Placeholder) */}
                <section className="settings-section">
                    <h2 className="section-title">Preferences</h2>
                    <p className="section-placeholder">Additional settings coming soon...</p>
                </section>
            </div>
        </div>
    );
};

export default SettingsPage;
