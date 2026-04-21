"use client"

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, RoundedBox, Environment } from '@react-three/drei'
import * as THREE from 'three'

// Brain Head - cute style
function BrainHead({ isTyping }: { isTyping: boolean }) {
  const brainRef = useRef<THREE.Group>(null)
  const [blink, setBlink] = useState(false)
  
  useFrame((state) => {
    if (!brainRef.current) return
    
    // Gentle head movement
    brainRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.05
    
    // Random blink
    if (Math.random() < 0.005) {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }
  })
  
  return (
    <group ref={brainRef} position={[0, 0.9, 0]}>
      {/* Brain base - pink wrinkly sphere */}
      <mesh>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color="#FFB6C1" roughness={0.6} metalness={0.1} />
      </mesh>
      
      {/* Brain wrinkles - bumps */}
      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[
          Math.cos(i * Math.PI / 4) * 0.35,
          0.15 + Math.sin(i * 1.5) * 0.1,
          Math.sin(i * Math.PI / 4) * 0.35
        ]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#FF9AAE" roughness={0.7} />
        </mesh>
      ))}
      
      {/* Brain top bumps */}
      <mesh position={[0.15, 0.35, 0.1]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#FFA5B4" roughness={0.6} />
      </mesh>
      <mesh position={[-0.15, 0.35, 0.1]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#FFA5B4" roughness={0.6} />
      </mesh>
      
      {/* Cute face on brain */}
      {/* Left eye */}
      <group position={[-0.15, 0, 0.4]}>
        <mesh>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.02, 0, 0.08]} scale={[1, blink ? 0.1 : 1, 1]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#2D1B4E" />
        </mesh>
        <mesh position={[0.04, 0.02, 0.1]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>
      
      {/* Right eye */}
      <group position={[0.15, 0, 0.4]}>
        <mesh>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.02, 0, 0.08]} scale={[1, blink ? 0.1 : 1, 1]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#2D1B4E" />
        </mesh>
        <mesh position={[0.04, 0.02, 0.1]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>
      
      {/* Cheeks - blush */}
      <mesh position={[-0.28, -0.08, 0.32]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#FF8FA3" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.28, -0.08, 0.32]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#FF8FA3" transparent opacity={0.6} />
      </mesh>
      
      {/* Mouth */}
      <MouthAnimation isTyping={isTyping} />
    </group>
  )
}

// Animated mouth
function MouthAnimation({ isTyping }: { isTyping: boolean }) {
  const mouthRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!mouthRef.current) return
    if (isTyping) {
      mouthRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 12) * 0.5
    } else {
      mouthRef.current.scale.y = 1
    }
  })
  
  return (
    <mesh ref={mouthRef} position={[0, -0.18, 0.4]}>
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshStandardMaterial color="#E85A71" />
    </mesh>
  )
}

// Robot Body
function RobotBody() {
  return (
    <group position={[0, 0.1, 0]}>
      {/* Main body - rounded rectangle */}
      <RoundedBox args={[0.6, 0.7, 0.4]} radius={0.1} position={[0, 0, 0]}>
        <meshStandardMaterial color="#E8541A" metalness={0.3} roughness={0.4} />
      </RoundedBox>
      
      {/* Chest panel */}
      <RoundedBox args={[0.4, 0.4, 0.05]} radius={0.05} position={[0, 0.05, 0.2]}>
        <meshStandardMaterial color="#FFF5F0" metalness={0.2} roughness={0.3} />
      </RoundedBox>
      
      {/* Heart/Core light */}
      <mesh position={[0, 0.05, 0.23]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#FF6B9D" emissive="#FF6B9D" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Belly button */}
      <mesh position={[0, -0.15, 0.22]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#C74516" />
      </mesh>
    </group>
  )
}

// Waving Arms
function Arms() {
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    // Right arm waves
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = -0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.4
      rightArmRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 3 + 0.5) * 0.2
    }
    // Left arm gentle movement
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = 0.2 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1
    }
  })
  
  return (
    <>
      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.45, 0.2, 0]}>
        {/* Upper arm */}
        <RoundedBox args={[0.15, 0.35, 0.15]} radius={0.05} position={[-0.1, -0.1, 0]}>
          <meshStandardMaterial color="#E8541A" metalness={0.3} roughness={0.4} />
        </RoundedBox>
        {/* Hand */}
        <mesh position={[-0.1, -0.35, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#FFE4C4" roughness={0.5} />
        </mesh>
      </group>
      
      {/* Right arm - waving */}
      <group ref={rightArmRef} position={[0.45, 0.2, 0]}>
        {/* Upper arm */}
        <RoundedBox args={[0.15, 0.35, 0.15]} radius={0.05} position={[0.1, -0.1, 0]}>
          <meshStandardMaterial color="#E8541A" metalness={0.3} roughness={0.4} />
        </RoundedBox>
        {/* Hand */}
        <mesh position={[0.1, -0.35, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#FFE4C4" roughness={0.5} />
        </mesh>
        {/* Fingers spread for wave */}
        {[...Array(4)].map((_, i) => (
          <mesh key={i} position={[0.1 + (i - 1.5) * 0.04, -0.45, 0.02]}>
            <capsuleGeometry args={[0.02, 0.06, 4, 8]} />
            <meshStandardMaterial color="#FFE4C4" roughness={0.5} />
          </mesh>
        ))}
      </group>
    </>
  )
}

// Legs
function Legs() {
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    // Subtle leg movement
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.05
      rightLegRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2 + Math.PI) * 0.05
    }
  })
  
  return (
    <>
      {/* Left leg */}
      <group ref={leftLegRef} position={[-0.15, -0.5, 0]}>
        <RoundedBox args={[0.18, 0.4, 0.18]} radius={0.05} position={[0, -0.1, 0]}>
          <meshStandardMaterial color="#E8541A" metalness={0.3} roughness={0.4} />
        </RoundedBox>
        {/* Foot */}
        <RoundedBox args={[0.2, 0.1, 0.25]} radius={0.03} position={[0, -0.35, 0.03]}>
          <meshStandardMaterial color="#C74516" metalness={0.4} roughness={0.3} />
        </RoundedBox>
      </group>
      
      {/* Right leg */}
      <group ref={rightLegRef} position={[0.15, -0.5, 0]}>
        <RoundedBox args={[0.18, 0.4, 0.18]} radius={0.05} position={[0, -0.1, 0]}>
          <meshStandardMaterial color="#E8541A" metalness={0.3} roughness={0.4} />
        </RoundedBox>
        {/* Foot */}
        <RoundedBox args={[0.2, 0.1, 0.25]} radius={0.03} position={[0, -0.35, 0.03]}>
          <meshStandardMaterial color="#C74516" metalness={0.4} roughness={0.3} />
        </RoundedBox>
      </group>
    </>
  )
}

// Full Robot Character
function BrainRobot({ isTyping }: { isTyping: boolean }) {
  const robotRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!robotRef.current) return
    // Gentle floating
    robotRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05
  })
  
  return (
    <group ref={robotRef}>
      <BrainHead isTyping={isTyping} />
      <RobotBody />
      <Arms />
      <Legs />
    </group>
  )
}

// Sparkles around mascot
function Sparkles() {
  const sparklesRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!sparklesRef.current) return
    sparklesRef.current.rotation.y = state.clock.elapsedTime * 0.3
  })
  
  return (
    <group ref={sparklesRef}>
      {[...Array(5)].map((_, i) => (
        <Float key={i} speed={3} rotationIntensity={0.5} floatIntensity={1.5}>
          <mesh position={[
            Math.cos(i * Math.PI * 2 / 5) * 1.2,
            0.5 + Math.sin(i * 2) * 0.4,
            Math.sin(i * Math.PI * 2 / 5) * 1.2
          ]} scale={0.8}>
            {/* Star shape */}
            <octahedronGeometry args={[0.06]} />
            <meshStandardMaterial 
              color={i % 2 === 0 ? "#FFD700" : "#FF69B4"} 
              emissive={i % 2 === 0 ? "#FFD700" : "#FF69B4"}
              emissiveIntensity={0.4}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

// Main Scene
function MascotScene({ isTyping }: { isTyping: boolean }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-3, 3, -3]} intensity={0.4} color="#FF69B4" />
      <pointLight position={[3, 3, -3]} intensity={0.4} color="#E8541A" />
      
      <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.3}>
        <BrainRobot isTyping={isTyping} />
      </Float>
      
      <Sparkles />
      
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
    sm: { width: 52, height: 52 },
    md: { width: 96, height: 96 },
    lg: { width: 128, height: 128 }
  }
  
  const { width, height } = sizeMap[size]
  
  return (
    <div style={{ width, height, borderRadius: '50%', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 0.5, 3.5], fov: 40 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <MascotScene isTyping={isTyping} />
      </Canvas>
    </div>
  )
}

export default ChatMascot3D
