// Viewport 3D reutilizável com convenções do Blender:
//   grade infinita, gizmo de eixos (X vermelho, Y verde, Z azul), órbita com o mouse
//   e atalhos de vista do teclado numérico: 7 topo · 1 frente · 3 direita · 0/5 perspectiva.
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { GizmoHelper, GizmoViewport, Grid, OrbitControls } from '@react-three/drei';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ComponentRef, type ReactNode, type RefObject } from 'react';
import * as THREE from 'three';

export type Vetor3 = [number, number, number];
type OrbitControlsImpl = ComponentRef<typeof OrbitControls>;

interface Vista {
  rotulo: string;
  tecla: string;
  pos: Vetor3;
  alvo: Vetor3;
}

export type NomeVista = 'topo' | 'frente' | 'direita' | 'perspectiva';

// Destino da animação de câmera; t força nova animação ao repetir a mesma vista.
type Destino = Vista & { t: number };

export interface ControleViewport {
  irPara: (nome: NomeVista) => void;
  // Posiciona a câmera sem animação e sem emitir aoMoverCamera (evita laço entre viewports).
  definirCamera: (pos: Vetor3, alvo: Vetor3) => void;
}

interface ApiCamera {
  definir: (pos: Vetor3, alvo: Vetor3) => void;
}

// Dentro do Canvas: expõe definirCamera e avisa quando a órbita muda (para sincronizar A/B).
function SincronizadorDeCamera({ apiRef, controlesRef, aoMover }: {
  apiRef: RefObject<ApiCamera | null>;
  controlesRef: RefObject<OrbitControlsImpl | null>;
  aoMover?: (pos: Vetor3, alvo: Vetor3) => void;
}) {
  const { camera } = useThree();
  const ignorar = useRef(false);
  useEffect(() => {
    apiRef.current = {
      definir: (pos, alvo) => {
        const c = controlesRef.current;
        ignorar.current = true;
        camera.position.set(...pos);
        c?.target.set(...alvo);
        c?.update();
        ignorar.current = false;
      },
    };
  }, [apiRef, camera, controlesRef]);
  useEffect(() => {
    const c = controlesRef.current;
    if (!c || !aoMover) return;
    const aoMudar = () => {
      if (ignorar.current) return;
      aoMover([camera.position.x, camera.position.y, camera.position.z], [c.target.x, c.target.y, c.target.z]);
    };
    c.addEventListener('change', aoMudar);
    return () => c.removeEventListener('change', aoMudar);
  }, [aoMover, camera, controlesRef]);
  return null;
}

export const VISTAS: Record<NomeVista, Vista> = {
  topo: { rotulo: 'Topo (drone)', tecla: '7', pos: [0, 11.5, 0.001], alvo: [0, 0, 0] },
  frente: { rotulo: 'Frente', tecla: '1', pos: [0, 2.2, 11], alvo: [0, 0.4, 0] },
  direita: { rotulo: 'Direita', tecla: '3', pos: [12, 2.4, 0], alvo: [0, 0.4, 0] },
  perspectiva: { rotulo: 'Perspectiva', tecla: '0', pos: [5.2, 5.4, 6.4], alvo: [0.4, 0.3, 0] },
};

const reduzirMovimento = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Anima câmera e alvo até a vista pedida; o arraste do usuário cancela a animação.
function AnimadorDeVista({ destino, controlesRef }: { destino: Destino; controlesRef: RefObject<OrbitControlsImpl | null> }) {
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
    // Com prefers-reduced-motion, a câmera salta direto para a vista pedida.
    const k = reduzirMovimento() ? 1 : 1 - Math.pow(0.001, dt);
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

interface PropsViewport {
  children?: ReactNode;
  vistaInicial?: NomeVista;
  altura?: number | string;
  // false: não responde às teclas 7/1/3/0 (o segundo viewport de uma comparação segue o primeiro).
  atalhos?: boolean;
  aoMoverCamera?: (pos: Vetor3, alvo: Vetor3) => void;
  // Chamado se o navegador descartar o contexto WebGL (o chamador pode trocar para a vista 2D).
  aoPerderContexto?: () => void;
  rotulo?: string;
}

const Viewport3D = forwardRef<ControleViewport, PropsViewport>(function Viewport3D(
  { children, vistaInicial = 'perspectiva', altura, atalhos = true, aoMoverCamera, aoPerderContexto, rotulo }, ref,
) {
  const controlesRef = useRef<OrbitControlsImpl>(null);
  const apiCamera = useRef<ApiCamera>(null);
  const [destino, setDestino] = useStateVista(vistaInicial);

  useImperativeHandle(ref, () => ({
    irPara: (nome: NomeVista) => setDestino({ ...VISTAS[nome], t: performance.now() }),
    definirCamera: (pos: Vetor3, alvo: Vetor3) => apiCamera.current?.definir(pos, alvo),
  }), [setDestino]);

  useEffect(() => {
    if (!atalhos) return;
    const teclas: Record<string, NomeVista> = { 7: 'topo', 1: 'frente', 3: 'direita', 0: 'perspectiva', 5: 'perspectiva' };
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.target as Element | null)?.closest('input, select, textarea')) return;
      const nome = teclas[e.key];
      if (nome) setDestino({ ...VISTAS[nome], t: performance.now() });
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [setDestino, atalhos]);

  const inicial = VISTAS[vistaInicial];
  return (
    <div className="viewport" style={altura ? { height: altura } : undefined} role="img" aria-label={rotulo ?? 'Cena 3D'}>
      <Canvas
        camera={{ position: inicial.pos, fov: 40, near: 0.05, far: 200 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          if (aoPerderContexto) gl.domElement.addEventListener('webglcontextlost', () => aoPerderContexto(), { once: true });
        }}
      >
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
        <SincronizadorDeCamera apiRef={apiCamera} controlesRef={controlesRef} aoMover={aoMoverCamera} />
        <GizmoHelper alignment="bottom-right" margin={[64, 64]}>
          <GizmoViewport axisColors={['#ff3352', '#8bdc00', '#2890ff']} labelColor="#111" />
        </GizmoHelper>
      </Canvas>
    </div>
  );
});

function useStateVista(inicial: NomeVista) {
  return useState<Destino>(() => ({ ...VISTAS[inicial], t: 0 }));
}

export default Viewport3D;

// Conversão imagem (px) → mundo 3D: 100 px = 1 unidade; x → X, y (para baixo) → Z.
export const ESCALA = 0.01;
export const pxParaMundo = (x: number, y: number, largura = 1280, altura = 720): [number, number] => [(x - largura / 2) * ESCALA, (y - altura / 2) * ESCALA];
