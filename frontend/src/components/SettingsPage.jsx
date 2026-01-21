import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import './SettingsPage.css';

const SettingsPage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [timezone, setTimezone] = useState('Asia/Kolkata'); // Default to IST per user location
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
                if (data.timezone) setTimezone(data.timezone);
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
                    timezone: timezone,
                    updatedAt: new Date()
                });
            } else {
                await setDoc(userDocRef, {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    timezone: timezone,
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

    const handleTimezoneChange = async (newTimezone) => {
        setTimezone(newTimezone);

        // Save timezone immediately to Firestore (no need to wait for form submit)
        try {
            const user = auth.currentUser;
            if (!user) return;

            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                timezone: newTimezone,
                updatedAt: new Date()
            });

            console.log("✅ Timezone saved immediately:", newTimezone);
        } catch (err) {
            console.error("Error saving timezone:", err);
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

                {/* Preferences Section */}
                <section className="settings-section">
                    <h2 className="section-title">Preferences</h2>
                    <form onSubmit={handleSave} className="settings-form">
                        <div className="form-group">
                            <div className="custom-select-container" style={{ flex: 1, position: 'relative' }}>
                                <div
                                    className={`custom-select-trigger ${timezone ? '' : 'placeholder'}`}
                                    onClick={() => !saving && document.getElementById('timezone-dropdown').classList.toggle('open')}
                                >
                                    {timezone ? (
                                        <>
                                            {timezone === "UTC" && "UTC (Universal Time)"}
                                            {timezone === "America/New_York" && "New York (EST/EDT)"}
                                            {timezone === "America/Los_Angeles" && "Los Angeles (PST/PDT)"}
                                            {timezone === "Europe/London" && "London (GMT/BST)"}
                                            {timezone === "Asia/Kolkata" && "India (IST)"}
                                            {timezone === "Asia/Tokyo" && "Tokyo (JST)"}
                                            {timezone === "Australia/Sydney" && "Sydney (AEDT)"}
                                        </>
                                    ) : "Select Timezone"}
                                    <span className="arrow">▼</span>
                                </div>
                                <div id="timezone-dropdown" className="custom-options">
                                    {[
                                        { val: "UTC", label: "UTC (Universal Time)" },
                                        { val: "America/New_York", label: "New York (EST/EDT)" },
                                        { val: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
                                        { val: "Europe/London", label: "London (GMT/BST)" },
                                        { val: "Asia/Kolkata", label: "India (IST)" },
                                        { val: "Asia/Tokyo", label: "Tokyo (JST)" },
                                        { val: "Australia/Sydney", label: "Sydney (AEDT)" }
                                    ].map(opt => (
                                        <div
                                            key={opt.val}
                                            className={`custom-option ${timezone === opt.val ? 'selected' : ''}`}
                                            onClick={() => {
                                                handleTimezoneChange(opt.val);
                                                document.getElementById('timezone-dropdown').classList.remove('open');
                                            }}
                                        >
                                            {opt.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="save-btn small-btn"
                                disabled={saving}
                                style={{ width: 'auto', padding: '0.8rem 1.5rem', margin: 0 }}
                            >
                                {saving ? 'Saving...' : 'Confirm'}
                            </button>
                        </div>
                        <span className="input-hint">Used for appointment scheduling</span>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default SettingsPage;
