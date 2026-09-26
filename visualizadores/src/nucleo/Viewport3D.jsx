// Viewport 3D reutilizável com convenções do Blender:
//   grade infinita, gizmo de eixos (X vermelho, Y verde, Z azul), órbita com o mouse
//   e atalhos de vista do teclado numérico: 7 topo · 1 frente · 3 direita · 0/5 perspectiva.
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { GizmoHelper, GizmoViewport, Grid, OrbitControls } from '@react-three/drei';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';

export const VISTAS = {
  topo: { rotulo: 'Topo (drone)', tecla: '7', pos: [0, 11.5, 0.001], alvo: [0, 0, 0] },
  frente: { rotulo: 'Frente', tecla: '1', pos: [0, 2.2, 11], alvo: [0, 0.4, 0] },
  direita: { rotulo: 'Direita', tecla: '3', pos: [12, 2.4, 0], alvo: [0, 0.4, 0] },
  perspectiva: { rotulo: 'Perspectiva', tecla: '0', pos: [5.2, 5.4, 6.4], alvo: [0.4, 0.3, 0] },
};

// Anima câmera e alvo até a vista pedida; o arraste do usuário cancela a animação.
function AnimadorDeVista({ destino, controlesRef }) {
  const { camera } = useThree();
  const ativo = useRef(false);
  const pos = useRef(new THREE.Vector3());
  const alvo = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!destino) return;
    pos.current.set(...destino.pos);
    alvo.current.set(...destino.alvo);
    ativo.current = true;
  }, [destino]);

  useEffect(() => {
    const c = controlesRef.current;
    if (!c) return;
    const parar = () => { ativo.current = false; };
    c.addEventListener('start', parar);
    return () => c.removeEventListener('start', parar);
  }, [controlesRef]);

  useFrame((_, dt) => {
    const c = controlesRef.current;
    if (!ativo.current || !c) return;
    const k = 1 - Math.pow(0.001, dt);
    camera.position.lerp(pos.current, k);
    c.target.lerp(alvo.current, k);
    c.update();
    if (camera.position.distanceTo(pos.current) < 0.01) {
      // Encaixa no destino exato: a vista final fica idêntica em toda execução.
      camera.position.copy(pos.current);
      c.target.copy(alvo.current);
      c.update();
      ativo.current = false;
    }
  });
  return null;
}

const Viewport3D = forwardRef(function Viewport3D({ children, vistaInicial = 'perspectiva', altura }, ref) {
  const controlesRef = useRef();
  const [destino, setDestino] = useStateVista(vistaInicial);

  useImperativeHandle(ref, () => ({ irPara: (nome) => setDestino({ ...VISTAS[nome], t: performance.now() }) }), [setDestino]);

  useEffect(() => {
    const teclas = { 7: 'topo', 1: 'frente', 3: 'direita', 0: 'perspectiva', 5: 'perspectiva' };
    const aoTeclar = (e) => {
      if (e.target.closest('input, select, textarea')) return;
      const nome = teclas[e.key];
      if (nome) setDestino({ ...VISTAS[nome], t: performance.now() });
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [setDestino]);

  const inicial = VISTAS[vistaInicial];
  return (
    <div className="viewport" style={altura ? { height: altura } : undefined}>
      <Canvas camera={{ position: inicial.pos, fov: 40, near: 0.05, far: 200 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={['#262626']} />
        <hemisphereLight args={['#dfe7f2', '#3a3326', 1.1]} />
        <directionalLight position={[6, 12, 4]} intensity={1.6} />
        <Grid
          position={[0, -0.02, 0]}
          infiniteGrid
          cellSize={0.5}
          sectionSize={2.5}
          cellColor="#3b3b3b"
          sectionColor="#4d4d4d"
          fadeDistance={45}
          fadeStrength={1.5}
        />
        {children}
        <OrbitControls ref={controlesRef} makeDefault target={inicial.alvo} maxPolarAngle={Math.PI / 2 - 0.02} />
        <AnimadorDeVista destino={destino} controlesRef={controlesRef} />
        <GizmoHelper alignment="bottom-right" margin={[64, 64]}>
          <GizmoViewport axisColors={['#ff3352', '#8bdc00', '#2890ff']} labelColor="#111" />
        </GizmoHelper>
      </Canvas>
    </div>
  );
});

function useStateVista(inicial) {
  return useState(() => ({ ...VISTAS[inicial], t: 0 }));
}

export default Viewport3D;

// Conversão imagem (px) → mundo 3D: 100 px = 1 unidade; x → X, y (para baixo) → Z.
export const ESCALA = 0.01;
export const pxParaMundo = (x, y, largura = 1280, altura = 720) => [(x - largura / 2) * ESCALA, (y - altura / 2) * ESCALA];
