import { Suspense, createContext, useContext, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { useAsset } from 'use-asset';
import './App.css';

function Nwero() {
  const context = useContext(SceneContext)
  const gltf = useAsset(async (ready) => {
    const loader = new GLTFLoader();
    if (!ready) return;
    const gltf = await loader.loadAsync('/vtuber_neuro-sama.glb');
    context.setLoaded(true);
    return gltf;
  }, GLTFLoader);

  if (!gltf || !context.loaded) return null;

  return <primitive object={gltf?.scene} />;
}

// The aim is to go for the "GIGACHAD" angles, so we'll do the following:
// The meme mostly consists of a camera panning across the model, so we'll keep a list of pairs of positions to interpolate between
// When we get to the end of one pair, we'll move to the next pair
// In addition, a second array will contain the rotation of the camera at each position one-to-one with each pair of positions
// When we get to the end of the pairs list, we loop back to the start

type PositionPair = [[x1: number, y1: number, z1: number], [x2: number, y2: number, z2: number]];
const positionPairs: PositionPair[] = [
  [[7.3, 45, 48.7], [-2, 45, 52]],
  [[0.8, 46.6, 47], [1.06, 36.6, 43]]
]

type CameraAngle = [x: number, y: number, z: number];
const cameraAngles: CameraAngle[] = [
  [-0.140, 0.000, 0.0126],
  [0.358, 0.210, -0.078]
]

function CameraController({ onCameraChange, interruptAnimation }: { onCameraChange?: (camera: THREE.Camera) => void, interruptAnimation?: boolean }) {
  const { camera } = useThree();
  const [index, setIndex] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const context = useContext(SceneContext)

  useEffect(() => {
    if (onCameraChange) {
      onCameraChange(camera);
    }
  }, [camera, onCameraChange]);

  useEffect(() => {
    console.log(camera.position);
    console.log(camera.rotation);
  }, [interruptAnimation]);
  

  useFrame(() => {

    if (interruptAnimation || !context.loaded) return;

    const elapsed = (Date.now() - startTime) / 1000; // time elapsed in seconds
    const t = elapsed / 2; // normalize to the duration of the animation

    if (t > 1) {
      setIndex((index + 1) % positionPairs.length);
      setStartTime(Date.now());
      console.log(index);
      console.log(positionPairs[index]);
    } else {
      const currentPair = positionPairs[index];
      const startPos = currentPair[0];
      const endPos = currentPair[1];

      // interpolate between the start and end positions
      const x = startPos[0] * (1 - t) + endPos[0] * t;
      const y = startPos[1] * (1 - t) + endPos[1] * t;
      const z = startPos[2] * (1 - t) + endPos[2] * t;

      camera.position.set(x, y, z);
      
      // Since the camera always has the same angle in the gigachad meme, we need
      camera.rotation.set(cameraAngles[index][0], cameraAngles[index][1], cameraAngles[index][2]);
    }
  });

  return null;
}

function SceneCanvas() {
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [cameraRotation, setCameraRotation] = useState<[number, number, number]>([0, 0, 0]);

  const [interruptAnimation, setInterruptAnimation] = useState(false);

  function onCameraChange(camera: THREE.Camera) {
    setCameraPosition([camera.position.x, camera.position.y, camera.position.z]);
    setCameraRotation([camera.rotation.x, camera.rotation.y, camera.rotation.z]);
  }

  return (
    <>
      <Canvas style={{ width: '100vw', height: '100vh' }}>
        <OrbitControls />
        <PerspectiveCamera makeDefault position={cameraPosition} />
        <CameraController onCameraChange={onCameraChange} interruptAnimation={interruptAnimation} />
        <Suspense fallback={null}>
          <Nwero />
        </Suspense>
      </Canvas>
      <span className="debug">
        Camera position: {
          // Format to 3 decimal places
          cameraPosition.map((pos) => pos.toPrecision(3)).join(', ')
        }
        <br />
        Camera rotation: {cameraRotation.map((pos) => pos.toPrecision(3)).join(', ')}
      </span>
      <span className="credit">Model credit <a href="#">Taprieiko</a> under <a href="http://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC</a>.</span>
      <button className="button" onClick={() => setInterruptAnimation(!interruptAnimation)}>{ interruptAnimation ? 'Unpause' : 'Pause' }</button>
    </>
  );
}

const SceneContext = createContext<{ loaded: boolean; setLoaded: (value: boolean) => void }>({
  loaded: false,
  setLoaded: () => {},
});

function App() {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <SceneContext.Provider value={{ loaded, setLoaded }}>
      <SceneCanvas />
    </SceneContext.Provider>
  );
}

export default App;
