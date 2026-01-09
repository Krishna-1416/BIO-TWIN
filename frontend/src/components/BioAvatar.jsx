import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function BioAvatar({ healthStatus, hydrationLevel }) {
    const meshRef = useRef();

    // Animate the sphere to "breathe" - simulating life
    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        // Breathing animation
        meshRef.current.scale.setScalar(1 + Math.sin(time * 1.5) * 0.02);
        // Slow rotation
        meshRef.current.rotation.y += 0.005;
        meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
    });

    // Determine appearance based on health state
    const getColor = () => {
        switch (healthStatus) {
            case 'Critical': return '#ef4444'; // Red-500
            case 'Warning': return '#f59e0b'; // Amber-500
            case 'Healthy': return '#10b981'; // Emerald-500
            default: return '#10b981';
        }
    };

    const getRoughness = () => {
        // Rough = Dehydrated, Smooth/Shiny = Hydrated
        return hydrationLevel === 'Low' ? 0.8 : 0.1;
    };

    return (
        <mesh ref={meshRef} position={[0, 0, 0]}>
            <sphereGeometry args={[2.2, 64, 64]} />
            <meshStandardMaterial
                color={getColor()}
                roughness={getRoughness()}
                metalness={0.2}
            />
        </mesh>
    );
}
