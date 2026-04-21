"use client"

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sphere, RoundedBox, Environment } from '@react-three/drei'
import * as THREE from 'three'

// Animated Robot Head
function RobotHead({ isTyping }: { isTyping: boolean }) {
  const headRef = useRef<THREE.Group>(null)
  const leftEyeRef = useRef<THREE.Mesh>(null)
  const rightEyeRef = useRef<THREE.Mesh>(null)
  const [blink, setBlink] = useState(false)

  useFrame((state) => {
    if (!headRef.current) return
    
    // Gentle floating animation
    headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    headRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05
    
    // Eye tracking (follow mouse slightly)
    const t = state.clock.elapsedTime
    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.position.x = -0.25 + Math.sin(t * 2) * 0.02
      rightEyeRef.current.position.x = 0.25 + Math.sin(t * 2) * 0.02
      
      // Blink animation
      const blinkScale = blink ? 0.1 : 1
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, blinkScale, 0.3)
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, blinkScale, 0.3)
    }
    
    // Random blink
    if (Math.random() < 0.005) {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }
  })

  return (
    <group ref={headRef}>
      {/* Main head - rounded box */}
      <RoundedBox args={[1.2, 1, 0.8]} radius={0.2} smoothness={4}>
        <meshStandardMaterial color="#E8541A" metalness={0.3} roughness={0.4} />
      </RoundedBox>
      
      {/* Face plate */}
      <RoundedBox args={[1, 0.7, 0.1]} radius={0.1} position={[0, 0, 0.4]}>
        <meshStandardMaterial color="#FFF5F0" metalness={0.1} roughness={0.3} />
      </RoundedBox>
      
      {/* Left eye */}
      <mesh ref={leftEyeRef} position={[-0.25, 0.1, 0.5]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.2} />
      </mesh>
      
      {/* Right eye */}
      <mesh ref={rightEyeRef} position={[0.25, 0.1, 0.5]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.2} />
      </mesh>
      
      {/* Eye highlights */}
      <mesh position={[-0.22, 0.13, 0.6]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.28, 0.13, 0.6]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Mouth - animated when typing */}
      <MouthAnimation isTyping={isTyping} />
      
      {/* Antenna */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 16]} />
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#4ADE80" emissive="#4ADE80" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Ears/Side panels */}
      <mesh position={[-0.65, 0, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.3]} />
        <meshStandardMaterial color="#C74516" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0.65, 0, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.3]} />
        <meshStandardMaterial color="#C74516" metalness={0.4} roughness={0.3} />
      </mesh>
    </group>
  )
}

// Animated mouth component
function MouthAnimation({ isTyping }: { isTyping: boolean }) {
  const mouthRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!mouthRef.current) return
    
    if (isTyping) {
      // Talking animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 15) * 0.3
      mouthRef.current.scale.y = scale
    } else {
      // Smile
      mouthRef.current.scale.y = 1
    }
  })
  
  return (
    <mesh ref={mouthRef} position={[0, -0.15, 0.5]}>
      <RoundedBox args={[0.3, 0.08, 0.05]} radius={0.02}>
        <meshStandardMaterial color="#1a1a2e" />
      </RoundedBox>
    </mesh>
  )
}

// Floating particles around mascot
function FloatingParticles() {
  const particlesRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!particlesRef.current) return
    particlesRef.current.rotation.y = state.clock.elapsedTime * 0.2
  })
  
  return (
    <group ref={particlesRef}>
      {[...Array(6)].map((_, i) => (
        <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <mesh position={[
            Math.cos(i * Math.PI / 3) * 1.5,
            Math.sin(i * 2) * 0.3,
            Math.sin(i * Math.PI / 3) * 1.5
          ]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial 
              color={i % 2 === 0 ? "#E8541A" : "#4ADE80"} 
              emissive={i % 2 === 0 ? "#E8541A" : "#4ADE80"}
              emissiveIntensity={0.3}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

// Main 3D Scene
function MascotScene({ isTyping }: { isTyping: boolean }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#E8541A" />
      
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <RobotHead isTyping={isTyping} />
      </Float>
      
      <FloatingParticles />
      
      <Environment preset="studio" />
    </>
  )
}

// Exported component
interface ChatMascot3DProps {
  isTyping?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ChatMascot3D({ isTyping = false, size = 'md' }: ChatMascot3DProps) {
  const sizeMap = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }
  
  return (
    <div className={`${sizeMap[size]} rounded-full overflow-hidden`}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <MascotScene isTyping={isTyping} />
      </Canvas>
    </div>
  )
}

export default ChatMascot3D
