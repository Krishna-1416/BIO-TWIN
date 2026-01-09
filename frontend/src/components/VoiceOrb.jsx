
import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Icosahedron, MeshWobbleMaterial, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { motion } from 'framer-motion-3d';

const VoiceOrb = ({ isActive = true, healthStatus = 'Neutral' }) => {
    const meshRef = useRef();
    const materialRef = useRef();
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const [isAudioStarted, setIsAudioStarted] = useState(false);

    // Determine color based on health status
    const getHealthColor = (status) => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('critical') || statusLower.includes('danger')) {
            return '#ff3b30'; // Red
        } else if (statusLower.includes('good') || statusLower.includes('healthy') || statusLower.includes('optimal')) {
            return '#30d158'; // Green
        } else if (statusLower.includes('warning') || statusLower.includes('moderate')) {
            return '#ff9500'; // Orange
        }
        return '#ff3b30'; // Default red
    };

    const orbColor = getHealthColor(healthStatus);

    useEffect(() => {
        const startAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();

                analyser.fftSize = 64; // Low size for responsiveness
                source.connect(analyser);

                analyserRef.current = analyser;
                dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
                setIsAudioStarted(true);
            } catch (err) {
                console.error("Microphone access denied:", err);
            }
        };

        if (isActive && !isAudioStarted) {
            // Browsers require user interaction to start audio context, 
            // but usually assuming interaction already happened or handling via click overlay if needed.
            // We'll try to start immediately.
            startAudio();
        }
    }, [isActive, isAudioStarted]);

    useFrame((state) => {
        // Idle animation if inactive or not ready
        if (!isActive || !meshRef.current || !analyserRef.current) {
            const time = state.clock.getElapsedTime();
            if (meshRef.current) {
                // Gentle breathing when inactive
                meshRef.current.scale.lerp(
                    { x: 1, y: 1, z: 1 },
                    0.1
                );
                // Constant slow rotation or subtle pulse
                if (materialRef.current) {
                    materialRef.current.factor = 0;
                    materialRef.current.speed = 0;
                }
            }
            return;
        }

        // Get audio data only if active
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Calculate average volume
        let sum = 0;
        const data = dataArrayRef.current;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }
        const average = sum / data.length;

        // Normalize (0-1)
        const normalizedVolume = average / 255;

        // Apply scaling (Base 1 + volume influence)
        const targetScale = 1 + normalizedVolume * 1.5;
        meshRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, 0.1);

        // Apply Wobble
        // More volume = faster, stronger wobble
        if (materialRef.current) {
            materialRef.current.factor = 0.3 + normalizedVolume * 2; // Expand distortion range
            materialRef.current.speed = 1 + normalizedVolume * 5;     // Speed up
        }

        // Color shift based on intensity?
        // materialRef.current.color.setHSL(0.6 + normalizedVolume * 0.2, 1, 0.5);
    });

    return (
        <motion.group
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
        >
            <Icosahedron ref={meshRef} args={[1.2, 20]}>
                <MeshWobbleMaterial
                    ref={materialRef}
                    factor={0.3}
                    speed={1}
                    color={orbColor} // Red core like the user's image
                    roughness={0.0}
                    metalness={0.8}
                />
            </Icosahedron>

            {/* Glowing Aura Effect */}
            <EffectComposer disableNormalPass>
                <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.6} levels={8} />
            </EffectComposer>
        </motion.group>
    );
};

export default VoiceOrb;
