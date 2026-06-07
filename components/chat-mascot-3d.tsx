"use client"

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, RoundedBox, Environment, Sphere } from '@react-three/drei'
import * as THREE from 'three'

// Creative AI-style Brain Orb with geometric elements
function BrainOrb({ isTyping }: { isTyping: boolean }) {
  const orbRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!orbRef.current) return
    orbRef.current.rotation.y = state.clock.elapsedTime * 0.3
  })
  
  return (
    <group ref={orbRef} position={[0, 0.8, 0]}>
      {/* Main glossy orb */}
      <mesh>
        <icosahedronGeometry args={[0.5, 4]} />
        <meshStandardMaterial 
          color="#A78BFA"
          metalness={0.7}
          roughness={0.15}
          envMapIntensity={1.5}
        />
      </mesh>
      
      {/* Inner glow */}
      <mesh scale={0.48}>
        <icosahedronGeometry args={[1, 4]} />
        <meshStandardMaterial 
          color="#E9D5FF"
          transparent
          opacity={0.3}
          emissive="#C4B5FD"
          emissiveIntensity={0.6}
        />
      </mesh>
      
      {/* Geometric accent rings */}
      {[...Array(3)].map((_, i) => (
        <group key={i} rotation={[
          Math.PI / 3 + i * 0.3,
          Math.PI / 4 + i * 0.2,
          0
        ]}>
          <mesh>
            <torusGeometry args={[0.6, 0.04, 8, 32]} />
            <meshStandardMaterial 
              color={['#06B6D4', '#06B6D4', '#0EA5E9'][i]}
              emissive={['#06B6D4', '#06B6D4', '#0EA5E9'][i]}
              emissiveIntensity={0.4}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
      
      {/* Eyes - glowing orbs */}
      <group position={[-0.15, 0.1, 0.45]}>
        <mesh scale={0.08}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            color="#00D9FF"
            emissive="#00D9FF"
            emissiveIntensity={1}
            toneMapped={false}
          />
        </mesh>
      </group>
      <group position={[0.15, 0.1, 0.45]}>
        <mesh scale={0.08}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            color="#00D9FF"
            emissive="#00D9FF"
            emissiveIntensity={1}
            toneMapped={false}
          />
        </mesh>
      </group>
      
      {/* Animated pulsing core */}
      {isTyping && (
        <mesh scale={[1, 1, 1]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial 
            color="#EC4899"
            transparent
            opacity={0.4}
            emissive="#EC4899"
            emissiveIntensity={0.8}
          />
        </mesh>
      )}
    </group>
  )
}

// Creative geometric body
function CreativeBody() {
  return (
    <group position={[0, -0.1, 0]}>
      {/* Main torso - glass-like */}
      <mesh>
        <boxGeometry args={[0.5, 0.8, 0.4]} />
        <meshStandardMaterial 
          color="#1F2937"
          metalness={0.6}
          roughness={0.3}
          envMapIntensity={1.2}
        />
      </mesh>
      
      {/* Center neon accent */}
      <RoundedBox args={[0.35, 0.55, 0.08]} radius={0.05} position={[0, 0, 0.25]}>
        <meshStandardMaterial 
          color="#06B6D4"
          emissive="#06B6D4"
          emissiveIntensity={0.7}
          metalness={0.9}
          roughness={0.1}
        />
      </RoundedBox>
      
      {/* Side accent lines */}
      {[-0.2, 0.2].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.26]}>
          <boxGeometry args={[0.08, 0.5, 0.05]} />
          <meshStandardMaterial 
            color="#0EA5E9"
            emissive="#0EA5E9"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
      
      {/* Geometric corner details */}
      {[[-0.25, 0.35], [0.25, 0.35], [-0.25, -0.35], [0.25, -0.35]].map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], 0.22]}>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
          <meshStandardMaterial 
            color="#06B6D4"
            emissive="#06B6D4"
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </group>
  )
}

// Animated geometric arms
function AnimatedArms() {
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2.5) * 0.3
      leftArmRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.5) * 0.05
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2.5 + Math.PI) * 0.3
      rightArmRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.5 + Math.PI) * 0.05
    }
  })
  
  return (
    <>
      <group ref={leftArmRef} position={[-0.35, 0.15, 0]}>
        <RoundedBox args={[0.12, 0.4, 0.12]} radius={0.04} position={[-0.1, -0.15, 0]}>
          <meshStandardMaterial 
            color="#1F2937"
            metalness={0.6}
            roughness={0.3}
          />
        </RoundedBox>
        <mesh position={[-0.1, -0.4, 0]} scale={0.1}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial 
            color="#06B6D4"
            emissive="#06B6D4"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
      
      <group ref={rightArmRef} position={[0.35, 0.15, 0]}>
        <RoundedBox args={[0.12, 0.4, 0.12]} radius={0.04} position={[0.1, -0.15, 0]}>
          <meshStandardMaterial 
            color="#1F2937"
            metalness={0.6}
            roughness={0.3}
          />
        </RoundedBox>
        <mesh position={[0.1, -0.4, 0]} scale={0.1}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial 
            color="#0EA5E9"
            emissive="#0EA5E9"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    </>
  )
}

// Geometric legs
function GeometricLegs() {
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.8) * 0.08
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.8 + Math.PI) * 0.08
    }
  })
  
  return (
    <>
      <group ref={leftLegRef} position={[-0.12, -0.6, 0]}>
        <RoundedBox args={[0.15, 0.35, 0.15]} radius={0.04} position={[0, -0.08, 0]}>
          <meshStandardMaterial 
            color="#111827"
            metalness={0.5}
            roughness={0.4}
          />
        </RoundedBox>
        <RoundedBox args={[0.18, 0.1, 0.22]} radius={0.03} position={[0, -0.32, 0.03]}>
          <meshStandardMaterial 
            color="#06B6D4"
            metalness={0.7}
            roughness={0.2}
          />
        </RoundedBox>
      </group>
      
      <group ref={rightLegRef} position={[0.12, -0.6, 0]}>
        <RoundedBox args={[0.15, 0.35, 0.15]} radius={0.04} position={[0, -0.08, 0]}>
          <meshStandardMaterial 
            color="#111827"
            metalness={0.5}
            roughness={0.4}
          />
        </RoundedBox>
        <RoundedBox args={[0.18, 0.1, 0.22]} radius={0.03} position={[0, -0.32, 0.03]}>
          <meshStandardMaterial 
            color="#0EA5E9"
            metalness={0.7}
            roughness={0.2}
          />
        </RoundedBox>
      </group>
    </>
  )
}

// Floating particles
function FloatingParticles() {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <Float key={i} speed={2.5 + i * 0.3} rotationIntensity={0.8} floatIntensity={1.2}>
          <mesh position={[
            Math.cos(i * Math.PI * 2 / 8) * 1.4,
            0.3 + Math.sin(i) * 0.5,
            Math.sin(i * Math.PI * 2 / 8) * 1.4
          ]} scale={0.05 + i * 0.01}>
            <octahedronGeometry args={[1, 1]} />
            <meshStandardMaterial 
              color={i % 2 === 0 ? '#06B6D4' : '#0EA5E9'}
              emissive={i % 2 === 0 ? '#06B6D4' : '#0EA5E9'}
              emissiveIntensity={0.6}
              metalness={0.8}
              roughness={0.1}
            />
          </mesh>
        </Float>
      ))}
    </>
  )
}

// Main scene
function AIArtScene({ isTyping }: { isTyping: boolean }) {
  return (
    <>
      <ambientLight intensity={0.4} color="#E0C3FC" />
      <directionalLight position={[4, 6, 3]} intensity={0.8} />
      <pointLight position={[-4, 4, -4]} intensity={0.6} color="#06B6D4" />
      <pointLight position={[4, 4, -4]} intensity={0.6} color="#0EA5E9" />
      
      <Float speed={1} rotationIntensity={0.15} floatIntensity={0.4}>
        <BrainOrb isTyping={isTyping} />
        <CreativeBody />
        <AnimatedArms />
        <GeometricLegs />
      </Float>
      
      <FloatingParticles />
      
      <Environment preset="apartment" />
    </>
  )
}

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
        camera={{ position: [0, 0.4, 3.2], fov: 40 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <AIArtScene isTyping={isTyping} />
      </Canvas>
    </div>
  )
}

export default ChatMascot3D
